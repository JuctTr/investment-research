import { IsEnum, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryTasksDto {
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
    description: '任务状态筛选',
    enum: TaskStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ description: '信息源 ID', example: 'clx...', required: false })
  @IsOptional()
  @IsString()
  sourceId?: string;
}
