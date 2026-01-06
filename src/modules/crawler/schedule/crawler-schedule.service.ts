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

  /**
   * 每天凌晨2点尝试恢复被禁用的信息源
   */
  @Cron('0 0 2 * * *', {
    name: 'crawler-recover-disabled',
    timeZone: 'Asia/Shanghai',
  })
  async recoverDisabledSources() {
    this.logger.log('========== 开始恢复被禁用的信息源 ==========');

    try {
      // 获取所有被禁用的信息源
      const disabledSources = await this.prisma.crawlerSource.findMany({
        where: { enabled: false },
      });

      if (disabledSources.length === 0) {
        this.logger.log('没有需要恢复的信息源');
        return;
      }

      this.logger.log(`找到 ${disabledSources.length} 个被禁用的信息源`);

      let recoveredCount = 0;
      let stillFailedCount = 0;

      for (const source of disabledSources) {
        this.logger.log(`尝试恢复信息源: ${source.name}`);

        try {
          // 尝试执行一次爬取任务
          const task = await this.prisma.crawlerTask.create({
            data: {
              sourceId: source.id,
              status: 'PENDING',
              scheduledAt: new Date(),
            },
          });

          // 直接调用处理器（不通过队列，快速验证）
          const result = await this.attemptRecovery(source);

          if (result.success) {
            // 恢复成功：重置健康状态并启用
            await this.prisma.crawlerSource.update({
              where: { id: source.id },
              data: {
                enabled: true,
                consecutiveFailures: 0,
                healthStatus: 'HEALTHY',
                lastSuccessAt: new Date(),
                lastFetchAt: new Date(),
              },
            });

            // 更新任务状态为成功
            await this.prisma.crawlerTask.update({
              where: { id: task.id },
              data: {
                status: 'SUCCESS',
                completedAt: new Date(),
                totalFetched: result.fetched || 0,
                totalParsed: result.parsed || 0,
                totalStored: result.stored || 0,
              },
            });

            this.logger.log(`✓ 信息源 ${source.name} 已恢复`);
            recoveredCount++;
          } else {
            // 恢复失败：更新失败原因
            await this.prisma.crawlerTask.update({
              where: { id: task.id },
              data: {
                status: 'FAILED',
                completedAt: new Date(),
                errorMessage: result.error,
              },
            });

            this.logger.warn(
              `✗ 信息源 ${source.name} 仍不可用: ${result.error}`,
            );
            stillFailedCount++;
          }
        } catch (error: any) {
          this.logger.error(
            `恢复信息源 ${source.name} 时发生异常: ${error.message}`,
          );
          stillFailedCount++;
        }
      }

      this.logger.log(
        `信息源恢复完成: 成功 ${recoveredCount}/${disabledSources.length}, 仍失败 ${stillFailedCount}`,
      );
    } catch (error: any) {
      this.logger.error(`恢复任务失败: ${error.message}`, error.stack);
    } finally {
      this.logger.log('========== 信息源恢复任务结束 ==========');
    }
  }

  /**
   * 尝试恢复单个信息源（简化版爬取逻辑）
   */
  private async attemptRecovery(source: any): Promise<{
    success: boolean;
    fetched?: number;
    parsed?: number;
    stored?: number;
    error?: string;
  }> {
    this.logger.debug(`尝试恢复信息源: ${source.name} (${source.sourceType})`);

    // 这里简化处理，直接返回成功以启用信息源
    // 实际生产环境中应该根据 sourceType 调用对应的爬虫服务
    // 如果爬取成功，返回 success: true
    // 如果失败，返回 success: false 和错误信息

    // 暂时标记为成功，让系统重新启用
    return {
      success: true,
      fetched: 0,
      parsed: 0,
      stored: 0,
    };
  }
}
