import { IsString, IsOptional, IsArray, IsEnum, IsNotEmpty } from 'class-validator'
import { ContentType } from '@prisma/client'

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  url?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsEnum(ContentType)
  contentType: ContentType

  @IsArray()
  @IsString({ each: true })
  tags: string[]
}