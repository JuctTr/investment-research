import { IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCrawlerTaskDto {
  @ApiProperty({ description: '信息源 ID', example: 'clx...' })
  @IsString()
  sourceId: string;

  @ApiProperty({
    description: '计划执行时间',
    type: Date,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;
}
