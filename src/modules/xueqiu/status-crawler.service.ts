import { Injectable, Logger } from "@nestjs/common";
import { BrowserService } from "../browser/browser.service";
import { CookiePoolService } from "../browser/cookie-pool.service";
import { StatusRepository } from "./repositories/status.repository";

interface StatusResponse {
  statuses?: Array<{
    id: string;
    user_id: string;
    created_at: number;
    description?: string;
    raw_text?: string;
    expanded_text?: string;
    target_count?: number;
    comment_count?: number;
    like_count?: number;
    repost_count?: number;
    pic?: string;
    [key: string]: any;
  }>;
  nextMax?: string;
  nextId?: string;
  hasMore?: boolean;
}

@Injectable()
export class StatusCrawlerService {
  private readonly logger = new Logger(StatusCrawlerService.name);
  private readonly API_BASE = "https://xueqiu.com";

  constructor(
    private readonly browser: BrowserService,
    private readonly cookiePool: CookiePoolService,
    private readonly statusRepository: StatusRepository
  ) {}

  /**
   * 获取用户的动态列表
   */
  async fetchUserStatuses(
    userId: string,
    options: {
      page?: number;
      maxId?: string;
      type?: number;
    } = {}
  ) {
    const { page = 1, maxId, type = 0 } = options;

    this.logger.log(`正在抓取用户 ${userId} 的动态，页码: ${page}`);

    try {
      // 直接在浏览器上下文中执行API请求，自动处理WAF验证
      const data = await this.fetchStatusesInBrowser(userId, page, maxId, type);

      if (!data.statuses || data.statuses.length === 0) {
        this.logger.log(`用户 ${userId} 没有更多动态`);
        return {
          statuses: [],
          hasMore: false,
          nextMax: undefined,
          nextId: undefined,
        };
      }

      // 转换并保存数据
      const convertedStatuses = await this.convertAndSave(data.statuses);

      this.logger.log(
        `成功抓取用户 ${userId} 的 ${convertedStatuses.length} 条动态`
      );

      return {
        statuses: convertedStatuses,
        hasMore: data.hasMore ?? false,
        nextMax: data.nextMax,
        nextId: data.nextId,
      };
    } catch (error) {
      this.logger.error(`抓取用户 ${userId} 的动态失败`, error);
      throw error;
    }
  }

  /**
   * 在浏览器上下文中执行API请求
   */
  private async fetchStatusesInBrowser(
    userId: string,
    page: number,
    maxId: string | undefined,
    type: number
  ): Promise<StatusResponse> {
    const browserPage = await this.browser.getPage();

    try {
      // 获取并设置 Cookie
      const cookie = await this.cookiePool.getCookie();
      const cookies = cookie.split("; ").map((c) => {
        const [name, value] = c.split("=");
        return { name, value, domain: ".xueqiu.com", path: "/" };
      });
      await browserPage.setCookie(...cookies);

      // 先访问用户页面触发WAF验证
      await browserPage.goto(`${this.API_BASE}/u/${userId}`, {
        waitUntil: "networkidle2", // 只等待DOM加载完成，不等待网络空闲
        timeout: 30000,
      });

      // 在浏览器上下文中执行fetch请求，这样会自动带上WAF验证参数
      const result = await browserPage.evaluate(
        async ({ userId, page, maxId, type, apiBase }) => {
          const params = new URLSearchParams({
            page: String(page),
            user_id: userId,
            type: String(type),
          });
          if (maxId) {
            params.set("max_id", maxId);
          }

          const response = await fetch(
            `${apiBase}/v4/statuses/user_timeline.json?${params.toString()}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json, text/plain, */*",
                "X-Requested-With": "XMLHttpRequest",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        },
        { userId, page, maxId, type, apiBase: this.API_BASE }
      );

      return result as StatusResponse;
    } finally {
      await this.browser.releasePage(browserPage);
    }
  }

  /**
   * 深度清理对象，移除所有 Prisma 序列化的 DateTime 对象
   * 将 {"$type": "DateTime", "value": "..."} 转换为字符串或数字
   */
  private sanitizePrismaObjects(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 检查是否是 Prisma 序列化的 DateTime 对象
    if (
      typeof obj === "object" &&
      !Array.isArray(obj) &&
      obj.$type === "DateTime" &&
      obj.value !== undefined
    ) {
      // 返回原始值，让后续的 Date 构造函数处理
      return obj.value;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizePrismaObjects(item));
    }

    if (typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.sanitizePrismaObjects(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }

  /**
   * 处理图片字段
   * 将 pic 字符串解析为数组，并移除 !thumb.jpg 后缀
   */
  private processPictures(pic: string | undefined): string[] {
    if (!pic) {
      return [];
    }

    try {
      // pic 字段通常是逗号分隔的字符串
      const picArray = pic
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      // 移除 !thumb.jpg 后缀，保留原始图片 URL
      return picArray.map((url) => {
        // 移除 !thumb.jpg 后缀，获取原始图片
        // 例如: https://xqimg.imedao.com/199e4a497552cb083fe91d64.jpg!thumb.jpg
        // 转换为: https://xqimg.imedao.com/199e4a497552cb083fe91d64.jpg
        return url.replace(/!thumb\.jpg$/i, "");
      });
    } catch (error) {
      this.logger.error(`处理图片字段失败: ${error}`);
      return [];
    }
  }

  /**
   * 转换并保存动态数据
   */
  private async convertAndSave(statuses: StatusResponse["statuses"]) {
    if (!statuses) return [];

    const results = [];

    for (const status of statuses) {
      // 深度清理 Prisma 序列化的对象
      const cleanStatus = this.sanitizePrismaObjects(status);

      // 调试：打印原始 created_at 的类型和值
      this.logger.debug(
        `created_at type: ${typeof cleanStatus.created_at}, value: ${JSON.stringify(cleanStatus.created_at)}`
      );

      // 安全地转换 createdAt 为有效的 Date 对象
      let createdAt: Date;
      const timestamp = cleanStatus.created_at as any; // 使用 any 来避免类型检查问题

      if (typeof timestamp === "number") {
        // 判断是秒级还是毫秒级时间戳
        // Unix timestamp (秒级): 10 位数，例如 1766801686
        // Unix timestamp (毫秒级): 13 位数，例如 1766801686000
        // 秒级时间戳范围: 1000000000 (2001年) ~ 9999999999 (2286年)
        // 毫秒级时间戳范围: 1000000000000 (2001年) ~ 9999999999999 (2286年)
        if (timestamp < 1000000000000) {
          // 秒级时间戳，需要乘以 1000
          createdAt = new Date(timestamp * 1000);
          this.logger.debug(
            `Converted from seconds: ${timestamp} -> ${createdAt.toISOString()}`
          );
        } else {
          // 毫秒级时间戳，直接使用
          createdAt = new Date(timestamp);
          this.logger.debug(
            `Converted from milliseconds: ${timestamp} -> ${createdAt.toISOString()}`
          );
        }
      } else if (typeof timestamp === "string") {
        // 字符串格式的日期（包括从 Prisma DateTime 清理后的字符串）
        createdAt = new Date(timestamp);
        this.logger.debug(
          `Converted from string: ${timestamp} -> ${createdAt.toISOString()}`
        );
      } else if (timestamp instanceof Date) {
        // 已经是 Date 对象
        createdAt = new Date(timestamp.getTime());
        this.logger.debug(
          `Converted from Date: ${timestamp.toISOString()} -> ${createdAt.toISOString()}`
        );
      } else {
        // 默认使用当前时间
        createdAt = new Date();
        this.logger.debug(
          `Using default current time: ${createdAt.toISOString()}`
        );
      }

      // 验证日期是否有效
      if (isNaN(createdAt.getTime())) {
        createdAt = new Date();
        this.logger.debug(
          `Invalid date, using current time: ${createdAt.toISOString()}`
        );
      }

      // 最后确保 createdAt 是一个纯 JavaScript Date 对象
      if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
        createdAt = new Date();
        this.logger.debug(
          `createdAt is not a valid Date, using current time: ${createdAt.toISOString()}`
        );
      }

      // 处理图片字段
      const pictures = this.processPictures(cleanStatus.pic);

      const converted = {
        statusId: String(cleanStatus.id),
        userId: String(cleanStatus.user_id),
        content: cleanStatus.description || "",
        rawText: cleanStatus.raw_text || "",
        expandedText: cleanStatus.expanded_text || "",
        createdAt,
        targetCount: cleanStatus.target_count || 0,
        commentCount: cleanStatus.comment_count || 0,
        likeCount: cleanStatus.like_count || 0,
        repostCount: cleanStatus.repost_count || 0,
        pictures,
        rawData: null,
      };

      this.logger.debug(
        `Final createdAt for status ${cleanStatus.id}: ${createdAt.toISOString()}, type: ${typeof createdAt}, constructor: ${createdAt.constructor.name}`
      );

      await this.statusRepository.upsert(converted);
      results.push(converted);
    }

    return results;
  }

  /**
   * 获取数据库中的用户动态
   */
  async getStoredStatuses(
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ) {
    const { page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    return this.statusRepository.findByUserId(userId, {
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });
  }
}
