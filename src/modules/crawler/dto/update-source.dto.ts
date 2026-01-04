import { IsString, IsBoolean, IsOptional, IsNumber, Min, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSourceDto } from './create-source.dto';

export class UpdateSourceDto extends PartialType(CreateSourceDto) {
  @ApiProperty({ description: '信息源名称', example: '段永平', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '数据源 URL', example: 'https://xueqiu.com/u/1247347556', required: false })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}
