import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.XUEQIU_CRAWLER)
    private readonly crawlerQueue: Queue
  ) {}

  /**
   * 添加爬取任务到队列
   */
  async addCrawlJob(userId: string, options?: { priority?: number; delay?: number }) {
    return this.crawlerQueue.add(
      'crawl-user',
      { userId },
      {
        priority: options?.priority || 5,
        delay: options?.delay || 0,
        jobId: `user:${userId}`, // 幂等性: 相同用户ID不会重复添加
      }
    );
  }

  /**
   * 批量添加爬取任务
   */
  async addCrawlJobs(userIds: string[], options?: { priority?: number }) {
    const jobs = userIds.map((userId) => ({
      name: 'crawl-user',
      data: { userId },
      opts: {
        priority: options?.priority || 5,
        jobId: `user:${userId}`,
      },
    }));

    return this.crawlerQueue.addBulk(jobs);
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.crawlerQueue.getWaitingCount(),
      this.crawlerQueue.getActiveCount(),
      this.crawlerQueue.getCompletedCount(),
      this.crawlerQueue.getFailedCount(),
      this.crawlerQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * 清空队列
   */
  async drainQueue() {
    await this.crawlerQueue.drain();
    this.logger.warn('队列已清空');
  }

  /**
   * 暂停队列
   */
  async pauseQueue() {
    await this.crawlerQueue.pause();
    this.logger.warn('队列已暂停');
  }

  /**
   * 恢复队列
   */
  async resumeQueue() {
    await this.crawlerQueue.resume();
    this.logger.log('队列已恢复');
  }
}
