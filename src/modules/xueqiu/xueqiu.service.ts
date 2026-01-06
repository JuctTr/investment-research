import { Injectable, Logger } from "@nestjs/common";
import { BrowserService } from "../browser/browser.service";
import { XueqiuParserService } from "../parser/xueqiu-parser.service";
import { UserProfileRepository } from "./repositories/user-profile.repository";

// 睡眠辅助函数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class XueqiuService {
  private readonly logger = new Logger(XueqiuService.name);
  private readonly XUEQIU_API_BASE = "https://xueqiu.com";

  constructor(
    private readonly browser: BrowserService,
    private readonly parser: XueqiuParserService,
    private readonly repository: UserProfileRepository
  ) {}

  /**
   * 立即抓取单个用户(同步)
   */
  async fetchUserProfile(userId: string) {
    this.logger.log(`正在抓取用户资料: ${userId}`);

    try {
      // 使用 Puppeteer 获取页面数据
      const userData = await this.fetchUserProfileWithPuppeteer(userId);

      // 验证数据
      if (!this.parser.validateUserData(userData)) {
        throw new Error("接收到的用户数据无效");
      }

      // 持久化
      const profile = await this.repository.upsert(userData);

      this.logger.log(`用户资料抓取成功: ${userId}`);
      return profile;
    } catch (error) {
      this.logger.error(`抓取用户资料失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 使用 Puppeteer 获取用户资料
   */
  private async fetchUserProfileWithPuppeteer(userId: string) {
    let page: any;
    try {
      page = await this.browser.getPage();
      const url = `${this.XUEQIU_API_BASE}/u/${userId}`;

      this.logger.debug(`正在访问页面: ${url}`);

      // 访问页面
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // 等待页面 JavaScript 执行和可能的 WAF 验证
      await sleep(3000);

      // 获取当前 URL
      let currentUrl = page.url();
      this.logger.log(`当前 URL: ${currentUrl}`);

      // 获取页面标题
      const pageTitle = await page.title();
      this.logger.log(`页面标题: ${pageTitle}`);

      // 检查是否有 WAF 挑战 - 带重试机制的验证处理
      const isWafChallenge = (title: string) =>
        title.includes("403") ||
        title.includes("Forbidden") ||
        title.includes("Just a moment") ||
        title.includes("Access denied") ||
        title.includes("安全验证") ||
        title.includes("验证") ||
        title.includes("Checking");

      const MAX_WAF_RETRIES = 3;
      const WAF_RETRY_DELAY = 10000;
      let retryCount = 0;

      while (isWafChallenge(pageTitle) && retryCount < MAX_WAF_RETRIES) {
        this.logger.warn(
          `检测到 WAF 挑战 (重试 ${retryCount + 1}/${MAX_WAF_RETRIES})，等待验证完成... 当前标题: ${pageTitle}`
        );
        await sleep(WAF_RETRY_DELAY);

        // 重新获取状态
        const newTitle = await page.title();
        currentUrl = page.url();

        this.logger.log(`等待后 - URL: ${currentUrl}, 标题: ${newTitle}`);

        // 验证是否通过
        if (isWafChallenge(newTitle)) {
          retryCount++;
          if (retryCount >= MAX_WAF_RETRIES) {
            throw new Error(
              `WAF 验证失败，已重试 ${MAX_WAF_RETRIES} 次。最后状态 - URL: ${currentUrl}, 标题: ${newTitle}`
            );
          }
          // 继续下一次重试
          continue;
        } else {
          this.logger.log("WAF 验证已通过，继续抓取数据");
          break;
        }
      }

      // 检查页面是否显示错误信息
      const pageText = await page.evaluate(() => {
        return document.body.innerText;
      });

      // 检查常见的错误提示
      const errorPatterns = [
        "哎呀！出错了",
        "你访问的页面不存在",
        "页面不存在",
        "404",
        "访问异常",
        "用户不存在",
      ];

      const hasErrorPage = errorPatterns.some((pattern) =>
        pageText.includes(pattern)
      );
      if (hasErrorPage) {
        // 提取错误详情用于日志
        const errorDetail = pageText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && line.length < 100)
          .slice(0, 5)
          .join(" | ");

        throw new Error(
          `雪球用户不存在或已被封禁 (userId: ${userId})。页面提示: ${errorDetail}`
        );
      }

      // 等待目标变量出现
      try {
        await page.waitForFunction(
          () => {
            const win = window as any;
            return win.SNOWMAN_TARGET || win.__INITIAL_STATE__;
          },
          { timeout: 10000 }
        );
      } catch {
        // 如果超时，尝试直接提取数据（可能数据已加载但变量名不同）
        this.logger.warn("等待数据变量超时，尝试直接提取");
      }

      // 尝试多种方式提取用户数据
      const userData = await page.evaluate(() => {
        // 方法1: SNOWMAN_TARGET
        if ((window as any).SNOWMAN_TARGET) {
          return (window as any).SNOWMAN_TARGET;
        }

        // 方法2: __INITIAL_STATE__
        if ((window as any).__INITIAL_STATE__) {
          return (window as any).__INITIAL_STATE__;
        }

        // 方法3: 从页面元素中提取
        const scripts = document.querySelectorAll("script");
        for (const script of Array.from(scripts)) {
          const text = script.textContent || "";
          const targetMatch = text.match(/SNOWMAN_TARGET\s*=\s*({[^;]+});/);
          if (targetMatch) {
            try {
              return JSON.parse(targetMatch[1]);
            } catch {
              continue;
            }
          }

          const stateMatch = text.match(/__INITIAL_STATE__\s*=\s*({[^;]+});/);
          if (stateMatch) {
            try {
              return JSON.parse(stateMatch[1]);
            } catch {
              continue;
            }
          }
        }

        return null;
      });

      if (!userData) {
        // 如果还是获取不到，返回页面 HTML 用于调试
        const html = await page.content();
        this.logger.debug(`页面 HTML 前 500 字符: ${html.substring(0, 500)}`);
        throw new Error(
          "无法从页面提取用户数据，可能被反爬虫拦截或页面结构已变化"
        );
      }

      // 记录实际获取的数据结构用于调试
      this.logger.debug(
        `获取到的 userData 结构: ${JSON.stringify(Object.keys(userData))}`
      );

      // 雪球返回的数据结构：userData 本身就是用户信息（使用 snake_case）
      // 可能的嵌套结构：userData.user, userData.userInfo, userData.profile
      // 需要先检查这些属性是否为有效对象（不是数组或 null）
      const isValidObject = (obj: any) =>
        obj && typeof obj === "object" && !Array.isArray(obj);

      const source =
        (isValidObject(userData.user) && userData.user) ||
        (isValidObject(userData.userInfo) && userData.userInfo) ||
        (isValidObject(userData.profile) && userData.profile) ||
        userData;

      // 检查是否有有效数据（通过检查是否有 id 或其他标识字段）
      const hasValidData =
        source &&
        (source.id ||
          source.userId ||
          source.uid ||
          source.screen_name ||
          source.screenName ||
          source.name);

      if (!hasValidData) {
        // 如果无法从页面数据提取用户信息，从 URL 提取作为备选方案
        this.logger.warn(
          `无法从页面数据提取用户信息，userData: ${JSON.stringify(userData).substring(0, 200)}`
        );

        const urlMatch = currentUrl.match(/\/u\/(\d+)/);
        const userIdFromUrl = urlMatch ? urlMatch[1] : userId;

        return {
          uid: userIdFromUrl,
          screenName: pageTitle.replace(" - 雪球", "") || "",
          followersCount: 0,
          friendsCount: 0,
          description: "",
          rawData: userData,
        };
      }

      // 转换为 DTO 格式（雪球 API 使用 snake_case，需要兼容多种命名）
      return {
        uid: String(source.id || source.userId || source.uid || userId),
        screenName:
          source.screen_name || source.screenName || source.name || "",
        followersCount:
          source.followers_count ??
          source.followersCount ??
          source.followers ??
          source.fans_count ??
          0,
        friendsCount:
          source.friends_count ??
          source.friendsCount ??
          source.following ??
          source.friend_count ??
          0,
        description: source.description ?? source.bio ?? source.intro ?? "",
        rawData: userData,
      };
    } finally {
      if (page) {
        await this.browser.releasePage(page);
      }
    }
  }
}
