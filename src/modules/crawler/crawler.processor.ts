import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlerService } from './crawler.service';
import { QUEUE_NAMES } from '../queue/queue.constants';

@Processor(QUEUE_NAMES.XUEQIU_CRAWLER)
export class CrawlerProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlerProcessor.name);

  constructor(private readonly crawler: CrawlerService) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<any> {
    const { userId } = job.data;

    this.logger.log(`正在处理任务 ${job.id}: 用户 ${userId}`);

    try {
      const profile = await this.crawler.fetchUserProfile(userId);
      this.logger.log(`任务 ${job.id} 完成: 用户 ${userId}`);
      return profile;
    } catch (error) {
      this.logger.error(`任务 ${job.id} 失败: 用户 ${userId}`, error.stack);
      throw error; // 抛出错误触发重试
    }
  }
}
