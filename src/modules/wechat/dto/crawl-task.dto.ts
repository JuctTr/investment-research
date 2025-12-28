import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrawlMode } from '@prisma/client';

/**
 * 创建微信爬取任务 DTO
 */
export class CreateWechatCrawlTaskDto {
  @ApiProperty({ description: '公众号ID' })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ description: '爬取模式', enum: CrawlMode })
  @IsOptional()
  @IsEnum(CrawlMode)
  crawlMode?: CrawlMode;

  @ApiPropertyOptional({ description: '是否增量更新', default: true })
  @IsOptional()
  @IsBoolean()
  incremental?: boolean;

  @ApiPropertyOptional({ description: '最大爬取页数', default: 10 })
  @IsOptional()
  @IsNumber()
  maxPages?: number;

  @ApiPropertyOptional({ description: '是否强制刷新', default: false })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

/**
 * 批量创建爬取任务 DTO
 */
export class CreateBatchWechatCrawlTaskDto {
  @ApiProperty({ description: '公众号ID数组', type: [String] })
  @IsArray()
  @IsString({ each: true })
  accountIds: string[];

  @ApiPropertyOptional({ description: '爬取模式', enum: CrawlMode })
  @IsOptional()
  @IsEnum(CrawlMode)
  crawlMode?: CrawlMode;

  @ApiPropertyOptional({ description: '是否增量更新', default: true })
  @IsOptional()
  @IsBoolean()
  incremental?: boolean;

  @ApiPropertyOptional({ description: '最大爬取页数', default: 10 })
  @IsOptional()
  @IsNumber()
  maxPages?: number;

  @ApiPropertyOptional({ description: '是否强制刷新', default: false })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

/**
 * 查询微信文章 DTO
 */
export class QueryWechatArticleDto {
  @ApiPropertyOptional({ description: '公众号ID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: '关键词搜索' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '开始时间（ISO 8601格式）' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间（ISO 8601格式）' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
