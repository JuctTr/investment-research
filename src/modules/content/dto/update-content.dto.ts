import { PartialType } from '@nestjs/swagger'
import { CreateContentDto } from './create-content.dto'
import { IsOptional, IsString } from 'class-validator'

export class UpdateContentDto extends PartialType(CreateContentDto) {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsString()
  content?: string
}