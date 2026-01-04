import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlerService } from './crawler.service';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { PrismaService } from '../../database/prisma.service';

/**
 * 统一爬虫任务处理器
 * 处理所有类型的信息源爬取任务，包括雪球、RSS、微信公众号等
 */
@Processor(QUEUE_NAMES.GENERIC_CRAWLER)
export class GenericCrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(GenericCrawlerProcessor.name);

  constructor(
    private readonly crawler: CrawlerService,
    private readonly prisma: PrismaService,
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
    }
  }

  /**
   * 处理雪球用户爬取任务
   */
  private async handleXueqiuUser(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    this.logger.log(`正在处理雪球用户任务 ${job.id}: 用户 ${userId}`);

    try {
      const profile = await this.crawler.fetchUserProfile(userId);
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
