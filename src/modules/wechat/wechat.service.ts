import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WechatAccountRepository } from './repositories/wechat-account.repository';
import { WechatArticleRepository } from './repositories/wechat-article.repository';
import { WechatParserService } from './services/wechat-parser.service';
import { WechatSogouService } from './services/wechat-sogou.service';
import { WechatPcService } from './services/wechat-pc.service';
import type {
  WechatAccount,
  WechatArticle,
  CrawlTaskContext,
  CrawlResult,
  WechatCrawlJobData,
} from './types/wechat.types';
import { CreateWechatAccountDto } from './dto/create-account.dto';
import { UpdateWechatAccountDto } from './dto/update-account.dto';
import type { AccountStatus, CrawlMode } from '@prisma/client';
import type { ArticleRawData, ArticleDetail } from './types/wechat.types';

/**
 * 降级失败计数器（内存存储）
 * 用于记录每种采集模式的失败次数，超过阈值后自动切换模式
 */
interface FailureCounter {
  sogou: number;
  wechatPc: number;
  lastResetTime: number;
}

/**
 * 降级配置
 */
const DEGRADE_CONFIG = {
  /** 搜狗失败阈值 */
  SOGOU_FAILURE_THRESHOLD: 10,
  /** PC 客户端失败阈值 */
  WECHAT_PC_FAILURE_THRESHOLD: 5,
  /** 计数器重置时间（毫秒）：1小时 */
  RESET_INTERVAL: 60 * 60 * 1000,
};

/**
 * 微信公众号业务服务
 *
 * 核心功能：
 * - 公众号和文章的增删改查
 * - 多模式采集（搜狗 / PC 客户端 / 自动）
 * - 降级机制：搜狗失败后自动切换到 PC 客户端
 * - 去重逻辑：URL、时间、内容哈希三级去重
 */
@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  /** 降级失败计数器（按 accountId 分组） */
  private failureCounters: Map<string, FailureCounter> = new Map();

  constructor(
    private readonly accountRepository: WechatAccountRepository,
    private readonly articleRepository: WechatArticleRepository,
    private readonly parserService: WechatParserService,
    private readonly sogouService: WechatSogouService,
    private readonly wechatPcService: WechatPcService,
  ) {}

  /**
   * 获取或创建失败计数器
   */
  private getFailureCounter(accountId: string): FailureCounter {
    let counter = this.failureCounters.get(accountId);
    const now = Date.now();

    // 如果计数器不存在或已过期，创建新的
    if (!counter || (now - counter.lastResetTime) > DEGRADE_CONFIG.RESET_INTERVAL) {
      counter = {
        sogou: 0,
        wechatPc: 0,
        lastResetTime: now,
      };
      this.failureCounters.set(accountId, counter);
    }

    return counter;
  }

  /**
   * 记录搜狗失败
   */
  private recordSogouFailure(accountId: string): void {
    const counter = this.getFailureCounter(accountId);
    counter.sogou++;
    this.logger.warn(
      `搜狗采集失败 (accountId=${accountId}), 失败次数: ${counter.sogou}/${DEGRADE_CONFIG.SOGOU_FAILURE_THRESHOLD}`,
    );
  }

  /**
   * 记录 PC 客户端失败
   */
  private recordWechatPcFailure(accountId: string): void {
    const counter = this.getFailureCounter(accountId);
    counter.wechatPc++;
    this.logger.warn(
      `PC客户端采集失败 (accountId=${accountId}), 失败次数: ${counter.wechatPc}/${DEGRADE_CONFIG.WECHAT_PC_FAILURE_THRESHOLD}`,
    );
  }

  /**
   * 重置失败计数器（采集成功后调用）
   */
  private resetFailureCounter(accountId: string, mode: 'SOGOU' | 'WECHAT_PC'): void {
    const counter = this.getFailureCounter(accountId);
    if (mode === 'SOGOU') {
      counter.sogou = 0;
    } else {
      counter.wechatPc = 0;
    }
  }

  /**
   * 判断是否需要降级
   * @param accountId 公众号 ID
   * @returns 是否需要从搜狗降级到 PC 客户端
   */
  private shouldDegrade(accountId: string): boolean {
    const counter = this.getFailureCounter(accountId);
    return counter.sogou >= DEGRADE_CONFIG.SOGOU_FAILURE_THRESHOLD;
  }

  /**
   * 确定实际使用的采集模式
   * @param accountId 公众号 ID
   * @param mode 请求的采集模式
   * @returns 实际使用的采集模式
   */
  private determineCrawlMode(
    accountId: string,
    mode: CrawlMode,
  ): 'SOGOU' | 'WECHAT_PC' {
    if (mode === 'SOGOU') {
      return 'SOGOU';
    }

    if (mode === 'WECHAT_PC') {
      return 'WECHAT_PC';
    }

    // AUTO 模式：根据失败计数器决定
    if (this.shouldDegrade(accountId)) {
      this.logger.log(`搜狗失败次数过多，降级到 PC 客户端 (accountId=${accountId})`);
      return 'WECHAT_PC';
    }

    return 'SOGOU';
  }

  // ==================== 账户管理 ====================

  /**
   * 创建公众号账户
   */
  async createAccount(dto: CreateWechatAccountDto): Promise<WechatAccount> {
    // 检查是否已存在
    const exists = await this.accountRepository.exists(dto.accountId);
    if (exists) {
      throw new Error(`公众号 ${dto.accountId} 已存在`);
    }

    return this.accountRepository.create({
      accountId: dto.accountId,
      name: dto.name,
      introduction: dto.introduction,
      avatarUrl: dto.avatarUrl,
      status: dto.status || 'ACTIVE',
      crawlMode: dto.crawlMode || 'AUTO',
      enabled: dto.enabled ?? true,
      tags: dto.tags || [],
      rawData: dto.rawData,
    });
  }

  /**
   * 批量创建公众号账户
   */
  async createAccounts(dtos: CreateWechatAccountDto[]): Promise<{ count: number }> {
    const data = dtos.map((dto) => ({
      accountId: dto.accountId,
      name: dto.name,
      introduction: dto.introduction,
      avatarUrl: dto.avatarUrl,
      status: dto.status || 'ACTIVE',
      crawlMode: dto.crawlMode || 'AUTO',
      enabled: dto.enabled ?? true,
      tags: dto.tags || [],
      rawData: dto.rawData,
    }));

    return this.accountRepository.upsertMany(data);
  }

  /**
   * 更新公众号账户
   */
  async updateAccount(id: string, dto: UpdateWechatAccountDto): Promise<WechatAccount> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new NotFoundException(`公众号 ID ${id} 不存在`);
    }

    return this.accountRepository.update(id, dto);
  }

  /**
   * 删除公众号账户
   */
  async deleteAccount(id: string): Promise<WechatAccount> {
    return this.accountRepository.delete(id);
  }

  /**
   * 获取公众号详情
   */
  async getAccount(id: string): Promise<WechatAccount | null> {
    return this.accountRepository.findByIdWithRelations(id);
  }

  /**
   * 根据 accountId 获取公众号
   */
  async getAccountByAccountId(accountId: string): Promise<WechatAccount | null> {
    return this.accountRepository.findByAccountId(accountId);
  }

  /**
   * 获取公众号列表
   */
  async getAccounts(params: {
    page?: number;
    pageSize?: number;
    status?: AccountStatus;
    crawlMode?: CrawlMode;
    keyword?: string;
  }): Promise<{ items: WechatAccount[]; total: number }> {
    const { page = 1, pageSize = 20, status, crawlMode, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (crawlMode) {
      where.crawlMode = crawlMode;
    }
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { introduction: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return this.accountRepository.findAll({
      skip,
      take: pageSize,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取所有启用的公众号
   */
  async getEnabledAccounts(options?: { status?: AccountStatus; crawlMode?: CrawlMode }): Promise<WechatAccount[]> {
    return this.accountRepository.findEnabledAccounts(options);
  }

  // ==================== 文章管理 ====================

  /**
   * 获取公众号文章列表
   */
  async getArticles(params: {
    accountId: string;
    page?: number;
    pageSize?: number;
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
  }): Promise<{ items: WechatArticle[]; total: number }> {
    const { accountId, page = 1, pageSize = 20, startDate, endDate, keyword } = params;
    const skip = (page - 1) * pageSize;

    return this.articleRepository.findByAccountId(accountId, {
      skip,
      take: pageSize,
      startDate,
      endDate,
      keyword,
    });
  }

  /**
   * 获取文章详情
   */
  async getArticle(articleId: string): Promise<WechatArticle | null> {
    return this.articleRepository.findByArticleId(articleId);
  }

  /**
   * 搜索文章
   */
  async searchArticles(params: {
    keyword: string;
    page?: number;
    pageSize?: number;
    accountIds?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ items: WechatArticle[]; total: number }> {
    const { keyword, page = 1, pageSize = 20, accountIds, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    return this.articleRepository.search({
      keyword,
      skip,
      take: pageSize,
      accountIds,
      startDate,
      endDate,
    });
  }

  // ==================== 爬取任务管理 ====================

  /**
   * 提交爬取任务（实际任务由队列处理器执行）
   */
  async submitCrawlTask(data: WechatCrawlJobData): Promise<{ jobId: string; message: string }> {
    // TODO: 将任务添加到队列
    // 这里暂时返回占位信息
    this.logger.log(`提交爬取任务: accountId=${data.accountId}, mode=${data.crawlMode}`);

    return {
      jobId: `job_${Date.now()}`,
      message: '任务已提交到队列',
    };
  }

  /**
   * 批量提交爬取任务
   */
  async submitBatchCrawlTasks(accountIds: string[], options?: {
    crawlMode?: CrawlMode;
    incremental?: boolean;
    maxPages?: number;
    forceRefresh?: boolean;
  }): Promise<{ jobIds: string[]; message: string }> {
    const jobIds: string[] = [];

    for (const accountId of accountIds) {
      const result = await this.submitCrawlTask({
        accountId,
        crawlMode: options?.crawlMode || 'AUTO',
        incremental: options?.incremental ?? true,
        maxPages: options?.maxPages ?? 10,
        forceRefresh: options?.forceRefresh ?? false,
      });
      jobIds.push(result.jobId);
    }

    return {
      jobIds,
      message: `已提交 ${jobIds.length} 个爬取任务`,
    };
  }

  /**
   * 执行爬取任务（带降级机制）
   * @param accountId 公众号业务ID
   * @param mode 采集模式
   * @returns 爬取结果
   */
  async executeCrawl(accountId: string, mode: CrawlMode): Promise<CrawlResult> {
    const startTime = Date.now();
    this.logger.log(`开始爬取公众号: ${accountId}, 模式: ${mode}`);

    try {
      // 确定实际使用的采集模式（AUTO 模式会根据失败计数器自动选择）
      const actualMode = this.determineCrawlMode(accountId, mode);
      this.logger.debug(`实际使用采集模式: ${actualMode}`);

      // 执行采集
      const result = await this.fetchAndSaveArticles(accountId, actualMode);

      // 采集成功，重置失败计数器
      if (result.success) {
        this.resetFailureCounter(accountId, actualMode);
      }

      const duration = Date.now() - startTime;
      return {
        ...result,
        duration,
        usedMode: actualMode,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`爬取失败: ${error.message}`);

      return {
        success: false,
        articlesFetched: 0,
        articlesStored: 0,
        errorMessage: error.message,
        errorStack: error.stack,
        duration,
      };
    }
  }

  /**
   * 采集文章并保存到数据库
   * @param accountId 公众号业务ID
   * @param mode 采集模式（SOGOU 或 WECHAT_PC）
   * @returns 爬取结果
   */
  async fetchAndSaveArticles(
    accountId: string,
    mode: 'SOGOU' | 'WECHAT_PC',
  ): Promise<Omit<CrawlResult, 'duration'>> {
    // 获取公众号信息
    const account = await this.getAccountByAccountId(accountId);
    if (!account) {
      throw new NotFoundException(`公众号 ${accountId} 不存在`);
    }

    // 获取最后发布时间（用于增量采集）
    const lastPublishTime = await this.articleRepository.getLatestPublishTime(account.id);

    // 根据模式选择采集服务
    let articlesRaw: ArticleRawData[];
    try {
      if (mode === 'SOGOU') {
        this.logger.log(`使用搜狗模式采集: ${accountId}`);
        articlesRaw = await this.sogouService.fetchArticles(accountId, 50);
      } else {
        this.logger.log(`使用PC客户端模式采集: ${accountId}`);
        articlesRaw = await this.wechatPcService.fetchHistoryMessages(accountId, {
          maxScrolls: 50,
          scrollWaitTime: 2000,
          parseDetail: false, // 稍后统一解析详情
        });
      }
    } catch (error: any) {
      // 记录失败
      if (mode === 'SOGOU') {
        this.recordSogouFailure(accountId);
      } else {
        this.recordWechatPcFailure(accountId);
      }
      throw error;
    }

    this.logger.log(`获取到 ${articlesRaw.length} 篇文章`);

    // 过滤和去重
    const filteredArticles = await this.filterDuplicates(
      account.id,
      articlesRaw,
      lastPublishTime,
    );
    this.logger.log(`过滤后剩余 ${filteredArticles.length} 篇新文章`);

    // 解析文章详情并保存
    let articlesStored = 0;
    for (const articleRaw of filteredArticles) {
      try {
        // 获取文章详情
        let articleDetail: ArticleDetail | undefined;
        try {
          if (mode === 'SOGOU') {
            // 将搜狗临时链接转换为永久链接
            const permanentUrl = await this.sogouService.convertToPermanentUrl(articleRaw.url);
            articleDetail = await this.sogouService.parseArticle(permanentUrl);
          } else {
            articleDetail = await this.wechatPcService.parseArticle(articleRaw.url);
          }
        } catch (error) {
          this.logger.warn(`解析文章详情失败: ${error.message}`);
          // 即使详情解析失败，也保存基本信息
        }

        // 标准化数据（传入数据库中的公众号ID）
        const articleData = this.parserService.normalizeArticleDataFromRaw(
          articleRaw,
          articleDetail,
          account.id,  // 传入数据库中的公众号ID
        );

        // 保存到数据库
        await this.articleRepository.upsert(articleData);
        articlesStored++;
      } catch (error: any) {
        this.logger.error(`保存文章失败: ${error.message}`);
      }
    }

    // 更新公众号统计信息
    if (articlesStored > 0) {
      await this.accountRepository.updateLastCrawlTime(account.id);
      if (filteredArticles.length > 0) {
        const latestArticle = filteredArticles[0];
        await this.accountRepository.updateLastPublishTime(account.id, latestArticle.publishTime);
      }
    }

    return {
      success: true,
      articlesFetched: articlesRaw.length,
      articlesStored,
    };
  }

  /**
   * 过滤重复文章
   * @param dbAccountId 数据库中的公众号ID
   * @param articlesRaw 原始文章列表
   * @param lastPublishTime 最后发布时间（用于增量过滤）
   * @returns 过滤后的文章列表
   */
  private async filterDuplicates(
    dbAccountId: string,
    articlesRaw: ArticleRawData[],
    lastPublishTime: Date | null,
  ): Promise<ArticleRawData[]> {
    const filtered: ArticleRawData[] = [];

    for (const article of articlesRaw) {
      // 生成文章ID
      const articleId = this.parserService.generateArticleId(article.url);

      // 检查是否已存在
      const exists = await this.articleRepository.exists(articleId);
      if (exists) {
        this.logger.debug(`文章已存在，跳过: ${articleId}`);
        continue;
      }

      // 增量过滤：如果文章发布时间早于或等于最后发布时间，跳过
      if (lastPublishTime && article.publishTime <= lastPublishTime) {
        this.logger.debug(`文章发布时间早于最后采集时间，跳过: ${article.title}`);
        continue;
      }

      filtered.push(article);
    }

    return filtered;
  }

  /**
   * 执行爬取任务（同步版本，用于测试或手动触发）
   * @deprecated 使用 executeCrawl 替代
   */
  async executeCrawlTask(context: CrawlTaskContext): Promise<CrawlResult> {
    const startTime = Date.now();
    this.logger.log(`开始爬取公众号: ${context.accountId}, 模式: ${context.crawlMode}`);

    try {
      // 获取公众号信息
      const account = await this.getAccountByAccountId(context.accountId);
      if (!account) {
        throw new NotFoundException(`公众号 ${context.accountId} 不存在`);
      }

      // 使用新的 executeCrawl 方法
      const result = await this.executeCrawl(account.accountId, context.crawlMode);
      const duration = Date.now() - startTime;

      return {
        ...result,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`爬取失败: ${error.message}`);

      return {
        success: false,
        articlesFetched: 0,
        articlesStored: 0,
        errorMessage: error.message,
        errorStack: error.stack,
        duration,
      };
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取公众号统计信息
   */
  async getAccountStats(accountId: string): Promise<{
    totalArticles: number;
    latestPublishTime: Date | null;
    lastCrawlTime: Date | null;
  }> {
    const account = await this.accountRepository.findByAccountId(accountId);
    if (!account) {
      throw new NotFoundException(`公众号 ${accountId} 不存在`);
    }

    const totalArticles = await this.articleRepository.countByAccountId(account.id);
    const latestPublishTime = await this.articleRepository.getLatestPublishTime(account.id);

    return {
      totalArticles,
      latestPublishTime,
      lastCrawlTime: account.lastCrawlAt,
    };
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    totalAccounts: number;
    enabledAccounts: number;
    totalArticles: number;
  }> {
    const [totalAccounts, enabledAccounts] = await Promise.all([
      this.accountRepository.count(),
      this.accountRepository.count({ enabled: true }),
    ]);

    // TODO: 添加文章总数统计
    const totalArticles = 0;

    return {
      totalAccounts,
      enabledAccounts,
      totalArticles,
    };
  }
}
