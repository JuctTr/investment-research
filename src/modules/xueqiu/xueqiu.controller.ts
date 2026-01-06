import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { XueqiuService } from './xueqiu.service';
import { StatusCrawlerService } from './status-crawler.service';

@ApiTags('雪球爬虫')
@Controller('xueqiu/crawler')
export class XueqiuController {
  constructor(
    private readonly xueqiu: XueqiuService,
    private readonly statusCrawler: StatusCrawlerService,
  ) {}

  @Get('users/:userId')
  @ApiOperation({ summary: '立即爬取单个用户' })
  @ApiResponse({ status: 200, description: '爬取成功' })
  async fetchUser(@Param('userId') userId: string) {
    return this.xueqiu.fetchUserProfile(userId);
  }

  // ==================== 动态抓取 ====================

  @Get('users/:userId/statuses')
  @ApiOperation({ summary: '爬取用户动态' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'maxId',
    required: false,
    type: String,
    description: '最大ID（用于分页）',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: Number,
    description: '动态类型：0=全部, 1=原创, 2=转发',
  })
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
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
  })
  async getStoredStatuses(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.statusCrawler.getStoredStatuses(userId, { page, pageSize });
  }
}
