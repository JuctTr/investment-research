import { Injectable } from '@nestjs/common';
import type { CrawlerSource } from '@prisma/client';

/**
 * 调度策略接口
 * 用于判断信息源是否应该被调度
 */
export interface IScheduleStrategy {
  /**
   * 判断信息源是否应该被调度
   * @param source 信息源
   * @returns 是否应该调度
   */
  shouldSchedule(source: CrawlerSource): Promise<boolean> | boolean;

  /**
   * 获取策略名称
   */
  getName(): string;
}

/**
 * 策略注册表标识
 */
export const SCHEDULE_STRATEGY = 'SCHEDULE_STRATEGY';
