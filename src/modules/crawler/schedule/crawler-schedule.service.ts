import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler.service';
import { QueueService } from '@/modules/queue/queue.service';
import { PrismaService } from '@/database/prisma.service';
import { IScheduleStrategy, SCHEDULE_STRATEGY } from './schedule-strategy.interface';
import { WechatScheduleStrategy } from './strategies/wechat-schedule.strategy';
import { RateLimitService } from '../rate-limit.service';

/**
 * 通用爬虫调度服务
 * 负责定期检查所有信息源，根据各自的 fetchInterval 创建爬取任务
 */
@Injectable()
export class CrawlerScheduleService {
  private readonly logger = new Logger(CrawlerScheduleService.name);
  private isScheduleRunning = false;
  private lastScheduleTime: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawler: CrawlerService,
    private readonly queue: QueueService,
    private readonly rateLimit: RateLimitService,
    @Inject(SCHEDULE_STRATEGY) private readonly defaultStrategy: IScheduleStrategy,
    private readonly wechatStrategy: WechatScheduleStrategy,
  ) {}

  /**
   * 每分钟执行一次调度
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'crawler-schedule',
    timeZone: 'Asia/Shanghai',
  })
  async scheduleCrawl() {
    // 防止重复执行
    if (this.isScheduleRunning) {
      this.logger.warn('调度任务正在运行，跳过本次执行');
      return;
    }

    this.isScheduleRunning = true;
    const startTime = Date.now();
    this.logger.log('========== 开始执行爬虫调度任务 ==========');

    try {
      // 获取所有启用的信息源
      const enabledSources = await this.prisma.crawlerSource.findMany({
        where: { enabled: true },
        orderBy: { lastFetchAt: 'asc' }, // 优先抓取最早抓取的
      });

      if (enabledSources.length === 0) {
        this.logger.log('没有启用的信息源，跳过调度');
        return;
      }

      this.logger.log(`找到 ${enabledSources.length} 个启用的信息源`);

      // 筛选需要调度的信息源
      const sourcesToSchedule = [];
      for (const source of enabledSources) {
        const strategy = this.getStrategy(source.sourceType);
        const shouldSchedule = await strategy.shouldSchedule(source);

        if (shouldSchedule) {
          sourcesToSchedule.push(source);
          this.logger.debug(
            `信息源 [${source.name}] (${source.sourceType}) 需要调度`,
          );
        }
      }

      if (sourcesToSchedule.length === 0) {
        this.logger.log('没有需要调度爬取的信息源');
        return;
      }

      // 应用限流控制：只对允许执行的信息源创建任务
      const sourcesAllowedToExecute = [];
      for (const source of sourcesToSchedule) {
        const canExecute = await this.rateLimit.canExecute(source.id);

        if (canExecute) {
          sourcesAllowedToExecute.push(source);
        } else {
          this.logger.debug(
            `信息源 [${source.name}] 被限流跳过`,
          );
        }
      }

      if (sourcesAllowedToExecute.length === 0) {
        this.logger.log('所有信息源均被限流，跳过本次调度');
        return;
      }

      // 为允许执行的信息源创建爬取任务
      const taskPromises = sourcesAllowedToExecute.map((source) =>
        this.createCrawlTask(source),
      );

      const results = await Promise.allSettled(taskPromises);

      // 统计结果
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      const duration = Date.now() - startTime;
      this.lastScheduleTime = new Date();

      this.logger.log(
        `爬虫调度任务完成: 成功 ${successCount}/${sourcesAllowedToExecute.length}, 失败 ${failedCount}, 限流跳过 ${sourcesToSchedule.length - sourcesAllowedToExecute.length}, 耗时 ${duration}ms`,
      );
    } catch (error: any) {
      this.logger.error(`爬虫调度任务失败: ${error.message}`, error.stack);
    } finally {
      this.isScheduleRunning = false;
      this.logger.log(
        `========== 爬虫调度任务结束，总耗时: ${Date.now() - startTime}ms ==========`,
      );
    }
  }

  /**
   * 为信息源创建爬取任务
   */
  private async createCrawlTask(source: any) {
    try {
      // 创建任务记录
      const task = await this.prisma.crawlerTask.create({
        data: {
          sourceId: source.id,
          status: 'PENDING',
          scheduledAt: new Date(),
        },
      });

      // 将任务加入队列
      await this.queue.addSourceJob(source.id, source.sourceType, task.id);

      this.logger.debug(
        `已为信息源 [${source.name}] 创建爬取任务: ${task.id}`,
      );

      return task;
    } catch (error: any) {
      this.logger.error(
        `为信息源 [${source.name}] 创建任务失败: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 根据信息源类型获取对应的调度策略
   */
  private getStrategy(sourceType: string): IScheduleStrategy {
    switch (sourceType) {
      case 'WECHAT':
        return this.wechatStrategy;
      default:
        return this.defaultStrategy;
    }
  }

  /**
   * 手动触发调度（用于测试）
   */
  async triggerSchedule() {
    this.logger.log('手动触发爬虫调度任务');
    await this.scheduleCrawl();
  }

  /**
   * 获取调度状态
   */
  getStatus() {
    return {
      isScheduleRunning: this.isScheduleRunning,
      lastScheduleTime: this.lastScheduleTime,
    };
  }
}
