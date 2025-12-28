import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { CookiePoolService } from '../browser/cookie-pool.service';
import { BrowserService } from '../browser/browser.service';
import { XueqiuParserService } from '../parser/xueqiu-parser.service';
import { UserProfileRepository } from '../xueqiu/repositories/user-profile.repository';
import { CreateCrawlTaskDto } from './dto/create-task.dto';

// 睡眠辅助函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly XUEQIU_API_BASE = 'https://xueqiu.com';

  constructor(
    private readonly queue: QueueService,
    private readonly cookiePool: CookiePoolService,
    private readonly browser: BrowserService,
    private readonly parser: XueqiuParserService,
    private readonly repository: UserProfileRepository
  ) {}

  /**
   * 提交批量爬取任务
   */
  async submitBatchTasks(dto: CreateCrawlTaskDto) {
    this.logger.log(`提交批量爬取任务: ${dto.userIds.length} 个用户`);

    const jobs = await this.queue.addCrawlJobs(dto.userIds, {
      priority: dto.priority || 5,
    });

    return {
      batchId: `batch-${Date.now()}`,
      taskCount: dto.userIds.length,
      estimatedTime: dto.userIds.length * 10, // 假设每个任务10秒
    };
  }

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
        throw new Error('接收到的用户数据无效');
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
    const page = await this.browser.getPage();
    const url = `${this.XUEQIU_API_BASE}/u/${userId}`;

    try {
      this.logger.debug(`正在访问页面: ${url}`);

      // 访问页面
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 等待页面 JavaScript 执行和可能的 WAF 验证
      await sleep(5000);

      // 获取当前 URL
      let currentUrl = page.url();
      this.logger.log(`当前 URL: ${currentUrl}`);

      // 获取页面标题
      const pageTitle = await page.title();
      this.logger.log(`页面标题: ${pageTitle}`);

      // 检查是否有 WAF 挑战 - 等待更长时间让 JavaScript 执行
      if (pageTitle.includes('403') || pageTitle.includes('Forbidden') || pageTitle.includes('Just a moment')) {
        this.logger.log('检测到 WAF 挑战，等待验证完成...');
        await sleep(10000);

        // 重新获取 URL
        currentUrl = page.url();
        const newTitle = await page.title();
        this.logger.log(`等待后 - URL: ${currentUrl}, 标题: ${newTitle}`);
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
        const scripts = document.querySelectorAll('script');
        for (const script of Array.from(scripts)) {
          const text = script.textContent || '';
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
        throw new Error('无法从页面提取用户数据，可能被反爬虫拦截或页面结构已变化');
      }

      // 记录实际获取的数据结构用于调试
      this.logger.debug(`获取到的 userData 结构: ${JSON.stringify(Object.keys(userData))}`);

      // 雪球返回的数据结构：userData 本身就是用户信息（使用 snake_case）
      // 可能的嵌套结构：userData.user, userData.userInfo, userData.profile
      // 需要先检查这些属性是否为有效对象（不是数组或 null）
      const isValidObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);

      const source =
        (isValidObject(userData.user) && userData.user) ||
        (isValidObject(userData.userInfo) && userData.userInfo) ||
        (isValidObject(userData.profile) && userData.profile) ||
        userData;

      // 检查是否有有效数据（通过检查是否有 id 或其他标识字段）
      const hasValidData = source && (source.id || source.userId || source.uid || source.screen_name || source.screenName || source.name);

      if (!hasValidData) {
        // 如果无法从页面数据提取用户信息，从 URL 提取作为备选方案
        this.logger.warn(`无法从页面数据提取用户信息，userData: ${JSON.stringify(userData).substring(0, 200)}`);

        const urlMatch = currentUrl.match(/\/u\/(\d+)/);
        const userIdFromUrl = urlMatch ? urlMatch[1] : userId;

        return {
          uid: userIdFromUrl,
          screenName: pageTitle.replace(' - 雪球', '') || '',
          followersCount: 0,
          friendsCount: 0,
          description: '',
          rawData: userData,
        };
      }

      // 转换为 DTO 格式（雪球 API 使用 snake_case，需要兼容多种命名）
      return {
        uid: String(source.id || source.userId || source.uid || userId),
        screenName: source.screen_name || source.screenName || source.name || '',
        followersCount: source.followers_count ?? source.followersCount ?? source.followers ?? source.fans_count ?? 0,
        friendsCount: source.friends_count ?? source.friendsCount ?? source.following ?? source.friends_count ?? 0,
        description: source.description ?? source.bio ?? source.intro ?? '',
        rawData: userData,
      };
    } finally {
      await this.browser.releasePage(page);
    }
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus() {
    return this.queue.getQueueStats();
  }

  /**
   * 预热 Cookie 池
   */
  async warmUpCookiePool(count?: number) {
    return this.cookiePool.warmUpPool(count);
  }

  /**
   * 获取 Cookie 池状态
   */
  async getCookiePoolStatus() {
    return this.cookiePool.getPoolStatus();
  }
}
