import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WechatService } from './wechat.service';
import { WechatHealthService } from './services/wechat-health.service';
import { WechatScheduleService } from './schedule/wechat-schedule.service';
import { CreateWechatAccountDto } from './dto/create-account.dto';
import { UpdateWechatAccountDto } from './dto/update-account.dto';
import type {
  CreateWechatCrawlTaskDto,
  CreateBatchWechatCrawlTaskDto,
} from './dto/crawl-task.dto';
import type { AccountStatus, CrawlMode } from '@prisma/client';

/**
 * 微信公众号控制器
 */
@ApiTags('微信公众号爬虫')
@Controller('wechat')
export class WechatController {
  constructor(
    private readonly wechatService: WechatService,
    private readonly healthService: WechatHealthService,
    private readonly scheduleService: WechatScheduleService,
  ) {}

  // ==================== 账户管理 ====================

  @Post('accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建公众号账户' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createAccount(@Body() dto: CreateWechatAccountDto) {
    return this.wechatService.createAccount(dto);
  }

  @Post('accounts/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量创建公众号账户' })
  @ApiResponse({ status: 200, description: '批量创建成功' })
  async createAccounts(@Body() dtos: CreateWechatAccountDto[]) {
    return this.wechatService.createAccounts(dtos);
  }

  @Get('accounts')
  @ApiOperation({ summary: '获取公众号列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, type: String, description: '账号状态' })
  @ApiQuery({ name: 'crawlMode', required: false, type: String, description: '爬取模式' })
  @ApiQuery({ name: 'keyword', required: false, type: String, description: '关键词搜索' })
  async getAccounts(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('crawlMode') crawlMode?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.wechatService.getAccounts({
      page,
      pageSize,
      status: status as AccountStatus,
      crawlMode: crawlMode as CrawlMode,
      keyword,
    });
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: '获取公众号详情' })
  @ApiParam({ name: 'id', description: '公众号 ID' })
  async getAccount(@Param('id') id: string) {
    return this.wechatService.getAccount(id);
  }

  @Get('accounts/by-account-id/:accountId')
  @ApiOperation({ summary: '根据 accountId 获取公众号' })
  @ApiParam({ name: 'accountId', description: '公众号唯一标识' })
  async getAccountByAccountId(@Param('accountId') accountId: string) {
    return this.wechatService.getAccountByAccountId(accountId);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: '更新公众号信息' })
  @ApiParam({ name: 'id', description: '公众号 ID' })
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateWechatAccountDto) {
    return this.wechatService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: '删除公众号' })
  @ApiParam({ name: 'id', description: '公众号 ID' })
  async deleteAccount(@Param('id') id: string) {
    return this.wechatService.deleteAccount(id);
  }

  @Get('accounts/stats')
  @ApiOperation({ summary: '获取系统统计信息' })
  async getSystemStats() {
    return this.wechatService.getSystemStats();
  }

  @Get('accounts/:accountId/stats')
  @ApiOperation({ summary: '获取公众号统计信息' })
  @ApiParam({ name: 'accountId', description: '公众号唯一标识' })
  async getAccountStats(@Param('accountId') accountId: string) {
    return this.wechatService.getAccountStats(accountId);
  }

  // ==================== 文章管理 ====================

  @Get('accounts/:accountId/articles')
  @ApiOperation({ summary: '获取公众号文章列表' })
  @ApiParam({ name: 'accountId', description: '公众号唯一标识' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '开始时间' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '结束时间' })
  @ApiQuery({ name: 'keyword', required: false, type: String, description: '关键词搜索' })
  async getArticles(
    @Param('accountId') accountId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.wechatService.getArticles({
      accountId,
      page,
      pageSize,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      keyword,
    });
  }

  @Get('articles/search')
  @ApiOperation({ summary: '搜索文章' })
  @ApiQuery({ name: 'keyword', required: true, type: String, description: '搜索关键词' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'accountIds', required: false, type: String, description: '公众号ID列表（逗号分隔）' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '开始时间' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '结束时间' })
  async searchArticles(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('accountIds') accountIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.wechatService.searchArticles({
      keyword,
      page,
      pageSize,
      accountIds: accountIds ? accountIds.split(',') : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('articles/:articleId')
  @ApiOperation({ summary: '获取文章详情' })
  @ApiParam({ name: 'articleId', description: '文章 ID' })
  async getArticle(@Param('articleId') articleId: string) {
    return this.wechatService.getArticle(articleId);
  }

  // ==================== 爬取任务管理 ====================

  @Post('crawl/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交爬取任务' })
  @ApiResponse({ status: 200, description: '任务已提交' })
  async submitCrawlTask(@Body() dto: CreateWechatCrawlTaskDto) {
    return this.wechatService.submitCrawlTask({
      accountId: dto.accountId,
      crawlMode: dto.crawlMode || 'AUTO',
      incremental: dto.incremental ?? true,
      maxPages: dto.maxPages ?? 10,
      forceRefresh: dto.forceRefresh ?? false,
    });
  }

  @Post('crawl/tasks/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量提交爬取任务' })
  @ApiResponse({ status: 200, description: '任务已批量提交' })
  async submitBatchCrawlTasks(@Body() dto: CreateBatchWechatCrawlTaskDto) {
    return this.wechatService.submitBatchCrawlTasks(dto.accountIds, {
      crawlMode: dto.crawlMode,
      incremental: dto.incremental,
      maxPages: dto.maxPages,
      forceRefresh: dto.forceRefresh,
    });
  }

  @Post('crawl/accounts/:accountId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '立即执行爬取任务（同步）' })
  @ApiParam({ name: 'accountId', description: '公众号唯一标识' })
  @ApiQuery({ name: 'crawlMode', required: false, type: String, description: '爬取模式' })
  @ApiQuery({ name: 'incremental', required: false, type: Boolean, description: '是否增量更新' })
  @ApiQuery({ name: 'maxPages', required: false, type: Number, description: '最大页数' })
  @ApiQuery({ name: 'forceRefresh', required: false, type: Boolean, description: '是否强制刷新' })
  async executeCrawlTask(
    @Param('accountId') accountId: string,
    @Query('crawlMode') crawlMode?: string,
    @Query('incremental') incremental?: string,
    @Query('maxPages') maxPages?: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    return this.wechatService.executeCrawlTask({
      accountId,
      crawlMode: (crawlMode as any) || 'AUTO',
      incremental: incremental === 'true',
      maxPages: maxPages ? parseInt(maxPages, 10) : 10,
      forceRefresh: forceRefresh === 'true',
    });
  }

  // ==================== 监控和健康检查 ====================

  @Get('health')
  @ApiOperation({ summary: '系统健康检查' })
  @ApiResponse({ status: 200, description: '健康检查结果' })
  async getHealth() {
    return this.healthService.checkHealth();
  }

  @Get('health/sogou')
  @ApiOperation({ summary: '检查搜狗可用性' })
  @ApiResponse({ status: 200, description: '搜狗健康状态' })
  async getSogouHealth() {
    return this.healthService.checkSogouHealth();
  }

  @Get('health/pc-client')
  @ApiOperation({ summary: '检查PC客户端连接状态' })
  @ApiResponse({ status: 200, description: 'PC客户端状态' })
  async getPcClientHealth() {
    return this.healthService.checkPcClientHealth();
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取采集统计信息' })
  @ApiResponse({ status: 200, description: '统计信息' })
  async getStatistics() {
    return this.healthService.getStatistics();
  }

  @Get('logs')
  @ApiOperation({ summary: '获取最近采集日志' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  @ApiResponse({ status: 200, description: '采集日志列表' })
  async getCrawlLogs(@Query('limit') limit?: number) {
    return this.healthService.getRecentLogs(limit || 20);
  }

  @Get('schedule/status')
  @ApiOperation({ summary: '获取定时任务调度状态' })
  @ApiResponse({ status: 200, description: '调度状态' })
  async getScheduleStatus() {
    return this.scheduleService.getStatus();
  }

  @Post('schedule/trigger-crawl')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发增量采集任务' })
  @ApiResponse({ status: 200, description: '任务已触发' })
  async triggerIncrementalCrawl() {
    await this.scheduleService.triggerIncrementalCrawl();
    return { message: '增量采集任务已触发' };
  }

  @Post('schedule/trigger-health-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发健康检查' })
  @ApiResponse({ status: 200, description: '健康检查已触发' })
  async triggerHealthCheck() {
    await this.scheduleService.triggerHealthCheck();
    return { message: '健康检查已触发' };
  }
}
