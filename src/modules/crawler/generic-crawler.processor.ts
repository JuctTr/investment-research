import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { PrismaService } from '../../database/prisma.service';
import { XueqiuService } from '../xueqiu/xueqiu.service';
import { StatusCrawlerService } from '../xueqiu/status-crawler.service';
import { CrawlerService } from './crawler.service';
import { RateLimitService } from './rate-limit.service';

/**
 * 统一爬虫任务处理器
 * 处理所有类型的信息源爬取任务，包括雪球、RSS、微信公众号等
 */
@Processor(QUEUE_NAMES.GENERIC_CRAWLER)
export class GenericCrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(GenericCrawlerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xueqiu: XueqiuService,
    private readonly xueqiuStatusCrawler: StatusCrawlerService,
    private readonly crawler: CrawlerService,
    private readonly rateLimit: RateLimitService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { sourceType, sourceId, taskId, userId } = job.data;

    this.logger.log(`正在处理任务 ${job.id}: ${sourceType} 类型`);

    try {
      // 处理雪球用户任务（兼容旧的调用方式）
      if (sourceType === 'XUEQIU_USER' && userId) {
        return this.handleXueqiuUser(job);
      }

      // 处理通用信息源任务
      if (sourceId && taskId) {
        return this.handleGenericSource(job);
      }

      throw new Error(`无效的任务参数: ${JSON.stringify(job.data)}`);
    } catch (error) {
      // 如果是通用信息源任务，更新任务状态为失败
      if (taskId) {
        await this.prisma.crawlerTask.update({
          where: { id: taskId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error.message,
            errorStack: error.stack,
          },
        }).catch(() => {
          // 如果更新失败（可能taskId不存在），忽略错误
        });
      }

      this.logger.error(`任务 ${job.id} 失败: ${sourceType}`, error.stack);
      throw error;
    } finally {
      // 通知限流服务任务已完成
      if (sourceId) {
        this.rateLimit.onTaskComplete(job.id, sourceId);
      }
    }
  }

  /**
   * 处理雪球用户爬取任务
   */
  private async handleXueqiuUser(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    this.logger.log(`正在处理雪球用户任务 ${job.id}: 用户 ${userId}`);

    try {
      const profile = await this.xueqiu.fetchUserProfile(userId);
      this.logger.log(`任务 ${job.id} 完成: 用户 ${userId}`);
      return profile;
    } catch (error) {
      this.logger.error(`任务 ${job.id} 失败: 用户 ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * 处理通用信息源爬取任务
   */
  private async handleGenericSource(job: Job<{ sourceId: string; taskId: string }>) {
    const { sourceId, taskId } = job.data;

    try {
      // 通知限流服务任务开始
      this.rateLimit.onTaskStart(taskId, sourceId);

      // 更新任务状态为运行中
      await this.prisma.crawlerTask.update({
        where: { id: taskId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // 获取信息源详情
      const source = await this.prisma.crawlerSource.findUnique({
        where: { id: sourceId },
      });

      if (!source) {
        throw new Error(`信息源 ${sourceId} 不存在`);
      }

      // 根据信息源类型执行不同的爬取逻辑
      const result = await this.crawlSource(source);

      // 更新任务状态为成功
      await this.prisma.crawlerTask.update({
        where: { id: taskId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          totalFetched: result.fetched || 0,
          totalParsed: result.parsed || 0,
          totalStored: result.stored || 0,
        },
      });

      // 更新信息源的最后抓取时间
      await this.prisma.crawlerSource.update({
        where: { id: sourceId },
        data: {
          lastFetchAt: new Date(),
        },
      });

      // 更新健康状态：成功
      await this.crawler.handleTaskCompletion(sourceId, true);

      this.logger.log(`任务 ${job.id} 完成: 信息源 ${source.name}`);
      return result;
    } catch (error) {
      // 更新任务状态为失败
      await this.prisma.crawlerTask.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });

      // 更新健康状态：失败
      await this.crawler.handleTaskCompletion(sourceId, false);

      throw error;
    }
  }

  /**
   * 根据信息源类型执行爬取
   */
  private async crawlSource(source: any) {
    const { sourceType, sourceUrl } = source;

    this.logger.log(`开始爬取 ${sourceType} 类型的信息源: ${sourceUrl}`);

    // 根据不同的 sourceType 调用不同的爬虫服务
    switch (sourceType) {
      case 'XUEQIU_USER_PROFILE':
        return this.crawlXueqiuUserProfile(source);
      case 'XUEQIU_USER_STATUSES':
        return this.crawlXueqiuUserStatuses(source);
      case 'RSS':
        return this.crawlRss(source);
      case 'WECHAT':
        return this.crawlWechat(source);
      case 'TWITTER':
        return this.crawlTwitter(source);
      case 'REDDIT':
        return this.crawlReddit(source);
      case 'HACKERNEWS':
        return this.crawlHackerNews(source);
      case 'CUSTOM':
        return this.crawlCustom(source);
      default:
        throw new Error(`不支持的信息源类型: ${sourceType}`);
    }
  }

  /**
   * 爬取雪球用户资料
   */
  private async crawlXueqiuUserProfile(source: any) {
    this.logger.log(`爬取雪球用户资料: ${source.sourceUrl}`);
    // 从 URL 中提取用户ID
    const userIdMatch = source.sourceUrl.match(/\/u\/(\w+)/);
    if (!userIdMatch) {
      throw new Error(`无效的雪球URL: ${source.sourceUrl}`);
    }
    const userId = userIdMatch[1];
    // 调用雪球用户资料爬取服务
    await this.xueqiu.fetchUserProfile(userId);
    return { fetched: 1, parsed: 1, stored: 1 };
  }

  /**
   * 爬取雪球用户动态
   */
  private async crawlXueqiuUserStatuses(source: any) {
    this.logger.log(`爬取雪球用户动态: ${source.sourceUrl}`);
    // 从 URL 中提取用户ID
    const userIdMatch = source.sourceUrl.match(/\/u\/(\w+)/);
    if (!userIdMatch) {
      throw new Error(`无效的雪球URL: ${source.sourceUrl}`);
    }
    const userId = userIdMatch[1];

    // 从 options 中获取配置
    const options = source.options || {};
    const page = options.page || 1;
    const type = options.type !== undefined ? options.type : 0;
    const maxPages = options.maxPages || 1;

    let totalFetched = 0;

    // 支持爬取多页
    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
      this.logger.log(`爬取用户 ${userId} 第 ${currentPage}/${maxPages} 页`);

      const result = await this.xueqiuStatusCrawler.fetchUserStatuses(userId, {
        page: currentPage,
        type,
      });

      totalFetched += result.statuses.length;

      // 如果没有更多数据，提前结束
      if (!result.hasMore) {
        this.logger.log(`用户 ${userId} 没有更多动态`);
        break;
      }

      // 避免请求过快
      if (currentPage < maxPages && result.hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { fetched: totalFetched, parsed: totalFetched, stored: totalFetched };
  }

  /**
   * 爬取 RSS 源
   */
  private async crawlRss(source: any) {
    this.logger.log(`爬取 RSS 源: ${source.sourceUrl}`);
    // TODO: 实现 RSS 爬取逻辑
    return { fetched: 0, parsed: 0, stored: 0 };
  }

  /**
   * 爬取微信公众号
   */
  private async crawlWechat(source: any) {
    this.logger.log(`爬取微信公众号: ${source.sourceUrl}`);
    // TODO: 调用 WechatService
    return { fetched: 0, parsed: 0, stored: 0 };
  }

  /**
   * 爬取 Twitter
   */
  private async crawlTwitter(source: any) {
    this.logger.log(`爬取 Twitter: ${source.sourceUrl}`);
    // TODO: 实现 Twitter 爬取逻辑
    return { fetched: 0, parsed: 0, stored: 0 };
  }

  /**
   * 爬取 Reddit
   */
  private async crawlReddit(source: any) {
    this.logger.log(`爬取 Reddit: ${source.sourceUrl}`);
    // TODO: 实现 Reddit 爬取逻辑
    return { fetched: 0, parsed: 0, stored: 0 };
  }

  /**
   * 爬取 Hacker News
   */
  private async crawlHackerNews(source: any) {
    this.logger.log(`爬取 Hacker News: ${source.sourceUrl}`);
    // TODO: 实现 Hacker News 爬取逻辑
    return { fetched: 0, parsed: 0, stored: 0 };
  }

  /**
   * 爬取自定义类型
   */
  private async crawlCustom(source: any) {
    this.logger.log(`爬取自定义源: ${source.sourceUrl}`);
    // TODO: 实现自定义爬取逻辑
    return { fetched: 0, parsed: 0, stored: 0 };
  }
}
