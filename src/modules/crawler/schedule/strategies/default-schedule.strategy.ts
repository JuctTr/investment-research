import { Injectable } from '@nestjs/common';
import type { CrawlerSource } from '@prisma/client';
import { IScheduleStrategy, SCHEDULE_STRATEGY } from '../schedule-strategy.interface';

/**
 * 默认调度策略
 * 适用于大多数信息源类型：RSS、Twitter、Reddit、HackerNews、自定义源等
 */
@Injectable()
export class DefaultScheduleStrategy implements IScheduleStrategy {
  getName(): string {
    return 'DefaultScheduleStrategy';
  }

  shouldSchedule(source: CrawlerSource): boolean {
    // 必须是启用状态
    if (!source.enabled) {
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
}

/**
 * 默认策略的 Provider
 */
export const DefaultScheduleStrategyProvider = {
  provide: SCHEDULE_STRATEGY,
  useClass: DefaultScheduleStrategy,
};
