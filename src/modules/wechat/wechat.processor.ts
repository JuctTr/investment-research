import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WechatService } from './wechat.service';
import { PrismaService } from '@/database/prisma.service';
import type { WechatCrawlJobData, CrawlResult } from './types/wechat.types';
import { CrawlStatus } from '@prisma/client';
import { QUEUE_NAMES } from '../queue/queue.constants';

/**
 * 微信爬虫队列处理器
 *
 * 功能：
 * - 处理 BullMQ 队列中的爬取任务
 * - 更新爬取日志状态
 * - 处理降级和重试逻辑
 * - 更新公众号统计信息
 */
@Processor(QUEUE_NAMES.WECHAT_CRAWLER)
export class WechatProcessor extends WorkerHost {
  private readonly logger = new Logger(WechatProcessor.name);

  constructor(
    private readonly wechatService: WechatService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  /**
   * 处理爬取任务
   * @param job 队列任务
   * @returns 爬取结果
   */
  async process(job: Job<WechatCrawlJobData>): Promise<CrawlResult> {
    const { accountId, crawlMode, incremental, maxPages, forceRefresh } = job.data;

    this.logger.log(`开始处理爬取任务: accountId=${accountId}, mode=${crawlMode}, jobId=${job.id}`);

    // 获取公众号信息（使用业务ID）
    const account = await this.wechatService.getAccountByAccountId(accountId);
    if (!account) {
      throw new Error(`公众号 ${accountId} 不存在`);
    }

    // 创建爬取日志（使用数据库主键ID，不是业务ID）
    const crawlLog = await this.prisma.wechatCrawlLog.create({
      data: {
        accountId: account.id, // 使用数据库主键ID
        crawlMode: crawlMode as any,
        status: CrawlStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      // 执行爬取（使用业务ID）
      const result = await this.wechatService.executeCrawl(accountId, crawlMode);

      // 更新爬取日志
      await this.prisma.wechatCrawlLog.update({
        where: { id: crawlLog.id },
        data: {
          status: result.success ? CrawlStatus.SUCCESS : CrawlStatus.FAILED,
          articlesFetched: result.articlesFetched,
          articlesStored: result.articlesStored,
          errorMessage: result.errorMessage,
          errorStack: result.errorStack,
          duration: result.duration,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `爬取任务完成: accountId=${accountId}, ` +
        `fetched=${result.articlesFetched}, stored=${result.articlesStored}, ` +
        `duration=${result.duration}ms, usedMode=${result.usedMode}, jobId=${job.id}`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(`爬取任务失败: ${error.message}`, error.stack);

      // 更新爬取日志为失败状态
      await this.prisma.wechatCrawlLog.update({
        where: { id: crawlLog.id },
        data: {
          status: CrawlStatus.FAILED,
          errorMessage: error.message,
          errorStack: error.stack,
          duration: Date.now() - crawlLog.startedAt.getTime(),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * 获取任务进度
   * @param logId 爬取日志ID
   * @returns 任务状态
   */
  async getJobProgress(logId: string) {
    return this.prisma.wechatCrawlLog.findUnique({
      where: { id: logId },
    });
  }

  /**
   * 获取公众号最近的爬取日志
   * @param accountId 公众号业务ID
   * @param limit 数量限制
   * @returns 爬取日志列表
   */
  async getRecentCrawlLogs(accountId: string, limit = 10) {
    const account = await this.wechatService.getAccountByAccountId(accountId);
    if (!account) {
      throw new Error(`公众号 ${accountId} 不存在`);
    }

    return this.prisma.wechatCrawlLog.findMany({
      where: { accountId: account.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
