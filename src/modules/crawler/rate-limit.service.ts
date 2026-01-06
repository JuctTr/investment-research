import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

/**
 * 限流配置
 */
interface RateLimitConfig {
  // 全局并发限制：同时运行的最大任务数
  globalMaxConcurrent: number;
  // 单源并发限制：同一信息源同时运行的最大任务数
  perSourceMaxConcurrent: number;
  // 时间窗口限流：单个信息源在时间窗口内的最大执行次数
  timeWindowLimit?: {
    windowMs: number; // 时间窗口（毫秒）
    maxExecutions: number; // 最大执行次数
  };
}

/**
 * 限流统计信息
 */
interface RateLimitStats {
  globalRunning: number; // 全局运行中的任务数
  perSourceRunning: Map<string, number>; // 每个信息源运行中的任务数
  sourceExecutionHistory: Map<string, number[]>; // 每个信息源的执行历史时间戳
}

/**
 * 限流服务
 * 负责控制爬取任务的并发数和执行频率
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // 默认限流配置
  private readonly defaultConfig: RateLimitConfig = {
    globalMaxConcurrent: 5, // 全局最多同时运行5个任务
    perSourceMaxConcurrent: 1, // 单个信息源最多同时运行1个任务
    timeWindowLimit: {
      windowMs: 60000, // 1分钟时间窗口
      maxExecutions: 1, // 最多执行1次
    },
  };

  // 运行中的任务统计
  private readonly runningTasks: Set<string> = new Set();

  // 每个信息源运行中的任务数
  private readonly perSourceRunning: Map<string, number> = new Map();

  // 每个信息源的执行历史时间戳
  private readonly executionHistory: Map<string, number[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 检查是否允许执行任务
   * @param sourceId 信息源ID
   * @param config 限流配置（可选，不传则使用默认配置）
   * @returns 是否允许执行
   */
  async canExecute(sourceId: string, config?: Partial<RateLimitConfig>): Promise<boolean> {
    const limitConfig = { ...this.defaultConfig, ...config };

    // 1. 检查全局并发限制
    if (this.runningTasks.size >= limitConfig.globalMaxConcurrent) {
      this.logger.debug(
        `全局并发限制: 当前运行 ${this.runningTasks.size}/${limitConfig.globalMaxConcurrent}`,
      );
      return false;
    }

    // 2. 检查单源并发限制
    const sourceRunning = this.perSourceRunning.get(sourceId) || 0;
    if (sourceRunning >= limitConfig.perSourceMaxConcurrent) {
      this.logger.debug(
        `信息源 ${sourceId} 并发限制: 当前运行 ${sourceRunning}/${limitConfig.perSourceMaxConcurrent}`,
      );
      return false;
    }

    // 3. 检查时间窗口限流
    if (limitConfig.timeWindowLimit) {
      const canExecuteInWindow = this.checkTimeWindowLimit(
        sourceId,
        limitConfig.timeWindowLimit,
      );
      if (!canExecuteInWindow) {
        this.logger.debug(`信息源 ${sourceId} 时间窗口限流: 执行过于频繁`);
        return false;
      }
    }

    return true;
  }

  /**
   * 记录任务开始
   * @param taskId 任务ID
   * @param sourceId 信息源ID
   */
  onTaskStart(taskId: string, sourceId: string): void {
    this.runningTasks.add(taskId);

    // 更新单源运行计数
    const current = this.perSourceRunning.get(sourceId) || 0;
    this.perSourceRunning.set(sourceId, current + 1);

    this.logger.debug(
      `任务 ${taskId} 开始执行，全局运行: ${this.runningTasks.size}, 信息源 ${sourceId} 运行: ${current + 1}`,
    );
  }

  /**
   * 记录任务结束
   * @param taskId 任务ID
   * @param sourceId 信息源ID
   */
  onTaskComplete(taskId: string, sourceId: string): void {
    this.runningTasks.delete(taskId);

    // 更新单源运行计数
    const current = this.perSourceRunning.get(sourceId) || 0;
    if (current <= 1) {
      this.perSourceRunning.delete(sourceId);
    } else {
      this.perSourceRunning.set(sourceId, current - 1);
    }

    // 记录执行历史
    this.recordExecution(sourceId);

    this.logger.debug(
      `任务 ${taskId} 完成，全局运行: ${this.runningTasks.size}, 信息源 ${sourceId} 运行: ${Math.max(0, current - 1)}`,
    );
  }

  /**
   * 获取限流状态
   */
  getStats() {
    return {
      globalRunning: this.runningTasks.size,
      globalMaxConcurrent: this.defaultConfig.globalMaxConcurrent,
      perSourceRunning: Object.fromEntries(this.perSourceRunning),
      perSourceMaxConcurrent: this.defaultConfig.perSourceMaxConcurrent,
    };
  }

  /**
   * 清理过期的执行历史记录
   * @param olderThanMs 清理早于此时长的记录（毫秒）
   */
  cleanExecutionHistory(olderThanMs: number = 3600000): void {
    const now = Date.now();
    const cutoff = now - olderThanMs;

    for (const [sourceId, timestamps] of this.executionHistory.entries()) {
      const validTimestamps = timestamps.filter((t) => t > cutoff);

      if (validTimestamps.length === 0) {
        this.executionHistory.delete(sourceId);
      } else {
        this.executionHistory.set(sourceId, validTimestamps);
      }
    }

    this.logger.debug(`清理执行历史记录，早于 ${olderThanMs}ms 的记录`);
  }

  /**
   * 检查时间窗口限流
   */
  private checkTimeWindowLimit(
    sourceId: string,
    limit: { windowMs: number; maxExecutions: number },
  ): boolean {
    const now = Date.now();
    const windowStart = now - limit.windowMs;

    // 获取该信息源的执行历史
    let history = this.executionHistory.get(sourceId);
    if (!history) {
      history = [];
      this.executionHistory.set(sourceId, history);
    }

    // 统计时间窗口内的执行次数
    const executionsInWindow = history.filter((t) => t > windowStart).length;

    return executionsInWindow < limit.maxExecutions;
  }

  /**
   * 记录执行历史
   */
  private recordExecution(sourceId: string): void {
    const now = Date.now();
    let history = this.executionHistory.get(sourceId);
    if (!history) {
      history = [];
      this.executionHistory.set(sourceId, history);
    }

    history.push(now);

    // 定期清理旧记录（保留最近1小时）
    if (history.length > 100) {
      const cutoff = now - 3600000;
      const validTimestamps = history.filter((t) => t > cutoff);
      this.executionHistory.set(sourceId, validTimestamps);
    }
  }
}
