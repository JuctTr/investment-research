import { IsArray, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrawlTaskDto {
  @ApiProperty({ description: '用户ID列表', example: ['1247347556', '1234567890'] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ description: '优先级 (1-10, 10最高)', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({ description: '延迟执行(毫秒)', required: false })
  @IsOptional()
  @IsNumber()
  delay?: number;
}
