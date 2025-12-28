import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { StatusCrawlerService } from './status-crawler.service';
import { CreateCrawlTaskDto } from './dto/create-task.dto';

@ApiTags('雪球爬虫')
@Controller('xueqiu/crawler')
export class CrawlerController {
  constructor(
    private readonly crawler: CrawlerService,
    private readonly statusCrawler: StatusCrawlerService,
  ) {}

  @Post('tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交批量爬取任务' })
  @ApiResponse({ status: 200, description: '任务已提交' })
  async submitTasks(@Body() dto: CreateCrawlTaskDto) {
    return this.crawler.submitBatchTasks(dto);
  }

  @Get('status')
  @ApiOperation({ summary: '获取队列状态' })
  getQueueStatus() {
    return this.crawler.getQueueStatus();
  }

  @Get('users/:userId')
  @ApiOperation({ summary: '立即爬取单个用户' })
  async fetchUser(@Param('userId') userId: string) {
    return this.crawler.fetchUserProfile(userId);
  }

  @Post('cookies/warmup')
  @ApiOperation({ summary: '预热 Cookie 池' })
  async warmUpCookies(@Body('count') count?: number) {
    return this.crawler.warmUpCookiePool(count);
  }

  @Get('cookies/status')
  @ApiOperation({ summary: '获取 Cookie 池状态' })
  getCookiePoolStatus() {
    return this.crawler.getCookiePoolStatus();
  }

  // ==================== 动态抓取 ====================

  @Get('users/:userId/statuses')
  @ApiOperation({ summary: '爬取用户动态' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'maxId', required: false, type: String, description: '最大ID（用于分页）' })
  @ApiQuery({ name: 'type', required: false, type: Number, description: '动态类型：0=全部, 1=原创, 2=转发' })
  async fetchUserStatuses(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('maxId') maxId?: string,
    @Query('type') type?: number,
  ) {
    return this.statusCrawler.fetchUserStatuses(userId, { page, maxId, type });
  }

  @Get('users/:userId/statuses/stored')
  @ApiOperation({ summary: '获取数据库中的用户动态' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页数量' })
  async getStoredStatuses(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.statusCrawler.getStoredStatuses(userId, { page, pageSize });
  }
}
