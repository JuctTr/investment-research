import { ApiProperty } from "@nestjs/swagger";
import { SourceType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from "class-validator";

export class CreateSourceDto {
  @ApiProperty({ description: "信息源名称", example: "段永平" })
  @IsString()
  name: string;

  @ApiProperty({
    description: "数据源类型",
    enum: SourceType,
    example: "RSS",
  })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty({
    description: "数据源 URL",
    example: "https://xueqiu.com/u/1247347556",
  })
  @IsUrl()
  sourceUrl: string;

  @ApiProperty({
    description: "是否启用",
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    description: "抓取间隔（秒）",
    example: 3600,
    required: false,
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Min(60)
  fetchInterval?: number;

  @ApiProperty({
    description: "认证配置（如 Cookie、Token 等）",
    example: { cookie: "xxx" },
    required: false,
  })
  @IsOptional()
  @IsObject()
  authConfig?: Record<string, any>;

  @ApiProperty({
    description: "其他配置选项",
    example: { headers: { "User-Agent": "xxx" } },
    required: false,
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}
