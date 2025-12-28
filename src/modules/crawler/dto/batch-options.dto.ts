import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchOptionsDto {
  @ApiProperty({ description: '回调URL', required: false })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiProperty({ description: '批次标签', required: false })
  @IsOptional()
  @IsString()
  tag?: string;
}
