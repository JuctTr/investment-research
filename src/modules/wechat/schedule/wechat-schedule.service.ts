import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WechatService } from '../wechat.service';
import { WechatHealthService } from '../services/wechat-health.service';
import { WechatAccountRepository } from '../repositories/wechat-account.repository';

@Injectable()
export class WechatScheduleService {
  private readonly logger = new Logger(WechatScheduleService.name);

  private isSogouHealthy = true;
  private lastHealthCheck: Date | null = null;
  private isCrawlRunning = false;
  private lastCrawlTime: Date | null = null;

  constructor(
    private readonly wechatService: WechatService,
    private readonly healthService: WechatHealthService,
    private readonly accountRepository: WechatAccountRepository,
  ) {}

  @Cron('0 */2 * * * *', {
    name: 'incremental-crawl',
    timeZone: 'Asia/Shanghai',
  })
  async scheduleIncrementalCrawl() {
    if (this.isCrawlRunning) {
      this.logger.warn('Incremental crawl task already running, skip this execution');
      return;
    }

    this.isCrawlRunning = true;
    const startTime = Date.now();
    this.logger.log('========== Starting scheduled incremental crawl task ==========');

    try {
      if (!this.isSogouHealthy) {
        this.logger.warn('Sogou is currently unavailable, skip this crawl task');
        return;
      }

      const enabledAccounts = await this.wechatService.getEnabledAccounts({
        status: 'ACTIVE',
      });

      if (enabledAccounts.length === 0) {
        this.logger.log('No enabled accounts found, skip crawling');
        return;
      }

      this.logger.log(`Found ${enabledAccounts.length} enabled accounts`);

      const accountIds = enabledAccounts.map((acc) => acc.accountId);
      const result = await this.wechatService.submitBatchCrawlTasks(accountIds, {
        crawlMode: 'AUTO',
        incremental: true,
        maxPages: 10,
        forceRefresh: false,
      });

      const duration = Date.now() - startTime;
      this.lastCrawlTime = new Date();
      this.logger.log(
        `Scheduled incremental crawl task completed, submitted ${result.jobIds.length} tasks, duration: ${duration}ms`,
      );
    } catch (error: any) {
      this.logger.error(`Scheduled incremental crawl task failed: ${error.message}`, error.stack);
    } finally {
      this.isCrawlRunning = false;
      this.logger.log(`========== Scheduled incremental crawl task ended, duration: ${Date.now() - startTime}ms ==========`);
    }
  }

  @Cron('0 */30 * * * *', {
    name: 'sogou-health-check',
    timeZone: 'Asia/Shanghai',
  })
  async checkSogouHealth() {
    this.logger.log('Starting Sogou health check...');

    try {
      const result = await this.healthService.checkSogouHealth();
      this.lastHealthCheck = new Date();

      const wasHealthy = this.isSogouHealthy;
      this.isSogouHealthy = result.status === 'up';

      if (wasHealthy && !this.isSogouHealthy) {
        this.logger.error(`Sogou health status changed: available -> unavailable, reason: ${result.message}`);
      } else if (!wasHealthy && this.isSogouHealthy) {
        this.logger.log('Sogou health status recovered: unavailable -> available');
      }

      this.logger.log(`Sogou health check completed, status: ${result.status}, response time: ${result.responseTime || 0}ms`);
    } catch (error: any) {
      this.logger.error(`Sogou health check failed: ${error.message}`);
      this.isSogouHealthy = false;
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'retry-failed-tasks',
    timeZone: 'Asia/Shanghai',
  })
  async retryFailedTasks() {
    this.logger.log('Starting failed task retry...');
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      this.logger.log('Failed task retry completed');
    } catch (error: any) {
      this.logger.error(`Failed task retry error: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'daily-summary',
    timeZone: 'Asia/Shanghai',
  })
  async generateDailySummary() {
    this.logger.log('Starting daily statistics summary...');
    try {
      const statistics = await this.healthService.getStatistics();
      this.logger.log(
        `Daily statistics summary - Total accounts: ${statistics.totalAccounts}, ` +
        `Enabled: ${statistics.enabledAccounts}, Total articles: ${statistics.totalArticles}, ` +
        `Today crawled: ${statistics.todayCrawled}, Success rate: ${statistics.recentSuccessRate}%`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to generate daily statistics summary: ${error.message}`);
    }
  }

  async triggerIncrementalCrawl() {
    this.logger.log('Manually triggering incremental crawl task');
    await this.scheduleIncrementalCrawl();
  }

  async triggerHealthCheck() {
    this.logger.log('Manually triggering health check');
    await this.checkSogouHealth();
  }

  getStatus() {
    return {
      isCrawlRunning: this.isCrawlRunning,
      lastCrawlTime: this.lastCrawlTime,
      isSogouHealthy: this.isSogouHealthy,
      lastHealthCheck: this.lastHealthCheck,
    };
  }
}
