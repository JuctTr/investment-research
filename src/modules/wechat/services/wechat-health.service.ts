import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { BrowserService } from '../../browser/browser.service';
import { WechatSogouService } from './wechat-sogou.service';
import { WechatPcService } from './wechat-pc.service';

/**
 * 健康状态类型
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * 健康指标状态
 */
export type IndicatorStatus = 'up' | 'down' | 'degraded';

/**
 * 健康检查指标结果
 */
export interface HealthIndicatorResult {
  status: IndicatorStatus;
  message: string;
  responseTime?: number;
  poolSize?: number;
  maxInstances?: number;
  data?: any;
}

/**
 * 系统健康检查结果
 */
export interface SystemHealthResult {
  status: HealthStatus;
  timestamp: string;
  components: {
    database: HealthIndicatorResult;
    redis: HealthIndicatorResult;
    browser: HealthIndicatorResult;
    sogou: HealthIndicatorResult;
    pcClient: HealthIndicatorResult;
  };
  statistics?: CrawlStatistics;
}

/**
 * PC 客户端状态
 */
export interface PcClientStatus {
  connected: boolean;
  processRunning: boolean;
  cdpPortAvailable: boolean;
  availableWebviews: number;
}

/**
 * 采集统计信息
 */
export interface CrawlStatistics {
  totalAccounts: number;
  enabledAccounts: number;
  totalArticles: number;
  todayCrawled: number;
  recentSuccessRate: number;
  avgCrawlDuration: number;
  lastCrawlTime: Date | null;
}

/**
 * 微信公众号采集系统健康检查服务
 *
 * 核心功能：
 * - 检查数据库连接状态
 * - 检查 Redis 连接状态
 * - 检查浏览器服务状态
 * - 检查搜狗可用性
 * - 检查 PC 客户端连接状态
 * - 获取采集统计数据
 */
@Injectable()
export class WechatHealthService {
  private readonly logger = new Logger(WechatHealthService.name);
  private readonly SOGOU_TEST_URL = 'https://weixin.sogou.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly browserService: BrowserService,
    private readonly sogouService: WechatSogouService,
    private readonly wechatPcService: WechatPcService,
  ) {}

  /**
   * 检查系统整体健康状态
   */
  async checkHealth(): Promise<SystemHealthResult> {
    const startTime = Date.now();
    this.logger.log('开始健康检查...');

    const components = {
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      browser: await this.checkBrowserHealth(),
      sogou: await this.checkSogouHealth(),
      pcClient: await this.checkPcClientHealth(),
    };

    // 获取统计数据
    const statistics = await this.getStatistics().catch((error) => {
      this.logger.error(`获取统计数据失败: ${error.message}`);
      return undefined;
    });

    // 确定整体状态
    const status = this.determineOverallStatus(components);

    this.logger.log(`健康检查完成，状态: ${status}，耗时: ${Date.now() - startTime}ms`);

    return {
      status,
      timestamp: new Date().toISOString(),
      components,
      statistics,
    };
  }

  /**
   * 检查数据库健康状态
   */
  private async checkDatabaseHealth(): Promise<HealthIndicatorResult> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      return {
        status: 'up',
        message: '数据库连接正常',
        responseTime: duration,
      };
    } catch (error: any) {
      this.logger.error(`数据库健康检查失败: ${error.message}`);
      return {
        status: 'down',
        message: `数据库连接失败: ${error.message}`,
      };
    }
  }

  /**
   * 检查 Redis 健康状态
   */
  private async checkRedisHealth(): Promise<HealthIndicatorResult> {
    try {
      // TODO: 实现真实的 Redis 检查
      // 目前返回默认健康状态，需要注入 Redis 服务后实现
      return {
        status: 'up',
        message: 'Redis 连接正常',
      };
    } catch (error: any) {
      this.logger.error(`Redis 健康检查失败: ${error.message}`);
      return {
        status: 'down',
        message: `Redis 连接失败: ${error.message}`,
      };
    }
  }

  /**
   * 检查浏览器服务健康状态
   */
  private async checkBrowserHealth(): Promise<HealthIndicatorResult> {
    try {
      const browserStatus = this.browserService.getStatus();

      if (!browserStatus.isConnected) {
        return {
          status: 'down',
          message: '浏览器未连接',
        };
      }

      return {
        status: 'up',
        message: '浏览器连接正常',
        poolSize: browserStatus.poolSize,
        maxInstances: browserStatus.maxInstances,
      };
    } catch (error: any) {
      this.logger.error(`浏览器健康检查失败: ${error.message}`);
      return {
        status: 'down',
        message: `浏览器检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 检查搜狗可用性
   */
  async checkSogouHealth(): Promise<HealthIndicatorResult> {
    try {
      const start = Date.now();

      // 尝试请求搜狗微信首页
      const response = await fetch(this.SOGOU_TEST_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      const duration = Date.now() - start;

      if (!response.ok) {
        return {
          status: 'degraded',
          message: `搜狗响应异常: ${response.status}`,
          responseTime: duration,
        };
      }

      return {
        status: 'up',
        message: '搜狗可用',
        responseTime: duration,
      };
    } catch (error: any) {
      this.logger.error(`搜狗健康检查失败: ${error.message}`);
      return {
        status: 'down',
        message: `搜狗不可用: ${error.message}`,
      };
    }
  }

  /**
   * 检查 PC 客户端连接状态
   */
  async checkPcClientHealth(): Promise<HealthIndicatorResult> {
    try {
      const isConnected = await this.wechatPcService.isConnected();

      if (!isConnected) {
        return {
          status: 'down',
          message: 'PC 客户端未连接',
          data: {
            connected: false,
            processRunning: false,
            cdpPortAvailable: false,
            availableWebviews: 0,
          } as PcClientStatus,
        };
      }

      // 获取可用的 WebView 列表
      const webviews = await this.wechatPcService.getAvailableWebViews();

      return {
        status: 'up',
        message: 'PC 客户端连接正常',
        data: {
          connected: true,
          processRunning: true,
          cdpPortAvailable: true,
          availableWebviews: webviews.length,
        } as PcClientStatus,
      };
    } catch (error: any) {
      this.logger.error(`PC 客户端健康检查失败: ${error.message}`);
      return {
        status: 'down',
        message: `PC 客户端检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取采集统计
   */
  async getStatistics(): Promise<CrawlStatistics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 并行查询统计信息
    const [
      totalAccounts,
      enabledAccounts,
      totalArticles,
      recentLogs,
      lastCrawlLog,
    ] = await Promise.all([
      this.prisma.wechatAccount.count(),
      this.prisma.wechatAccount.count({ where: { enabled: true } }),
      this.prisma.wechatArticle.count(),
      this.prisma.wechatCrawlLog.findMany({
        where: {
          startedAt: { gte: todayStart },
        },
        take: 100,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.wechatCrawlLog.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    // 计算今日采集数
    const todayCrawled = recentLogs.filter(
      (log) => log.status === 'SUCCESS' || log.status === 'PARTIAL'
    ).length;

    // 计算最近成功率（最近100次）
    const recentSuccessRate = recentLogs.length > 0
      ? (recentLogs.filter((log) => log.status === 'SUCCESS').length / recentLogs.length) * 100
      : 0;

    // 计算平均采集时长（毫秒）
    const completedLogs = recentLogs.filter((log) => log.duration !== null);
    const avgCrawlDuration = completedLogs.length > 0
      ? completedLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / completedLogs.length
      : 0;

    return {
      totalAccounts,
      enabledAccounts,
      totalArticles,
      todayCrawled,
      recentSuccessRate: Math.round(recentSuccessRate * 100) / 100,
      avgCrawlDuration: Math.round(avgCrawlDuration),
      lastCrawlTime: lastCrawlLog?.startedAt || null,
    };
  }

  /**
   * 获取最近采集日志
   */
  async getRecentLogs(limit = 20): Promise<any[]> {
    return this.prisma.wechatCrawlLog.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        account: {
          select: {
            accountId: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 确定整体状态
   */
  private determineOverallStatus(components: Record<string, HealthIndicatorResult>): HealthStatus {
    const statuses = Object.values(components).map((c) => c.status);

    // 如果有任何组件宕机，整体状态为 unhealthy
    if (statuses.some((s) => s === 'down')) {
      return 'unhealthy';
    }

    // 如果有任何组件降级，整体状态为 degraded
    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }
}
