import { IsEnum, IsOptional, IsNumber, Min, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';
import { Type } from 'class-transformer';

export class QuerySourcesDto {
  @ApiProperty({ description: '页码', example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 20, required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;

  @ApiProperty({
    description: '数据源类型筛选',
    enum: SourceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SourceType)
  type?: SourceType;

  @ApiProperty({ description: '是否启用', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ description: '搜索关键词（名称或 URL）', example: 'xueqiu', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}
