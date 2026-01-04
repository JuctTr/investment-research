import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NAMES } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.GENERIC_CRAWLER)
    private readonly crawlerQueue: Queue
  ) {}

  /**
   * 添加爬取任务到队列（统一接口）
   */
  async addCrawlJob(
    sourceType: string,
    targetId: string,
    options?: { priority?: number; delay?: number; taskId?: string }
  ) {
    const data: any = { sourceType, targetId };

    // 如果是雪球用户任务
    if (sourceType === 'XUEQIU_USER') {
      data.userId = targetId;
    }

    // 如果是通用信息源任务
    if (options?.taskId) {
      data.sourceId = targetId;
      data.taskId = options.taskId;
    }

    return this.crawlerQueue.add(
      'crawl-source',
      data,
      {
        priority: options?.priority || 5,
        delay: options?.delay || 0,
        jobId: options?.taskId || `${sourceType}_${targetId}`,
      }
    );
  }

  /**
   * 批量添加爬取任务（雪球用户）
   */
  async addCrawlJobs(userIds: string[], options?: { priority?: number }) {
    const jobs = userIds.map((userId) => ({
      name: 'crawl-source',
      data: { sourceType: 'XUEQIU_USER', userId },
      opts: {
        priority: options?.priority || 5,
        jobId: `XUEQIU_USER_${userId}`,
      },
    }));

    return this.crawlerQueue.addBulk(jobs);
  }

  /**
   * 添加通用信息源爬取任务到队列
   */
  async addSourceJob(
    sourceId: string,
    sourceType: string,
    taskId: string,
    options?: { priority?: number; delay?: number }
  ) {
    return this.crawlerQueue.add(
      'crawl-source',
      { sourceType, sourceId, taskId },
      {
        priority: options?.priority || 5,
        delay: options?.delay || 0,
        jobId: taskId,
      }
    );
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
