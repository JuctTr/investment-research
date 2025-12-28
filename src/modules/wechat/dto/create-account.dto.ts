import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, CrawlMode } from '@prisma/client';

/**
 * 创建微信公众号账户 DTO
 */
export class CreateWechatAccountDto {
  @ApiProperty({ description: '公众号唯一标识' })
  @IsString()
  @MaxLength(100)
  accountId: string;

  @ApiProperty({ description: '公众号名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '公众号简介', type: String })
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ description: '账号状态', enum: AccountStatus, default: AccountStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: '爬取模式', enum: CrawlMode, default: CrawlMode.AUTO })
  @IsOptional()
  @IsEnum(CrawlMode)
  crawlMode?: CrawlMode;

  @ApiPropertyOptional({ description: '是否启用', default: true })
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
