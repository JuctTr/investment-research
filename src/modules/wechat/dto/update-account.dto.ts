import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, MaxLength, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, CrawlMode } from '@prisma/client';

/**
 * 更新微信公众号账户 DTO
 */
export class UpdateWechatAccountDto {
  @ApiPropertyOptional({ description: '公众号名称' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: '公众号简介', type: String })
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ description: '账号状态', enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: '爬取模式', enum: CrawlMode })
  @IsOptional()
  @IsEnum(CrawlMode)
  crawlMode?: CrawlMode;

  @ApiPropertyOptional({ description: '粉丝数' })
  @IsOptional()
  @IsNumber()
  followersCount?: number;

  @ApiPropertyOptional({ description: '发布文章数' })
  @IsOptional()
  @IsNumber()
  publishCount?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: '标签数组', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '原始数据' })
  @IsOptional()
  rawData?: Record<string, any>;
}
