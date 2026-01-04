import { Injectable } from '@nestjs/common';
import type { CrawlerSource } from '@prisma/client';
import { IScheduleStrategy, SCHEDULE_STRATEGY } from '../schedule-strategy.interface';
import { WechatHealthService } from '@/modules/wechat/services/wechat-health.service';

/**
 * 微信调度策略
 * 除了检查时间和启用状态，还需要检查搜狗健康状态
 */
@Injectable()
export class WechatScheduleStrategy implements IScheduleStrategy {
  constructor(private readonly healthService: WechatHealthService) {}

  getName(): string {
    return 'WechatScheduleStrategy';
  }

  async shouldSchedule(source: CrawlerSource): Promise<boolean> {
    // 必须是启用状态
    if (!source.enabled) {
      return false;
    }

    // 检查搜狗是否健康
    const isHealthy = await this.checkSogouHealth();
    if (!isHealthy) {
      return false;
    }

    // 如果从未抓取过，应该调度
    if (!source.lastFetchAt) {
      return true;
    }

    // 检查是否到达下次抓取时间
    const now = Date.now();
    const lastFetch = new Date(source.lastFetchAt).getTime();
    const nextFetchTime = lastFetch + source.fetchInterval * 1000;

    return now >= nextFetchTime;
  }

  /**
   * 检查搜狗健康状态
   */
  private async checkSogouHealth(): Promise<boolean> {
    try {
      const result = await this.healthService.checkSogouHealth();
      return result.status === 'up';
    } catch (error) {
      return false;
    }
  }
}

/**
 * 微信策略的 Provider
 */
export const WechatScheduleStrategyProvider = {
  provide: WechatScheduleStrategy,
  useClass: WechatScheduleStrategy,
};
