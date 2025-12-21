import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ContentService } from './content.service'
import { CreateContentDto } from './dto/create-content.dto'
import { UpdateContentDto } from './dto/update-content.dto'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('contents')
@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @ApiOperation({ summary: '创建内容' })
  @ApiResponse({ status: 201, description: '内容创建成功' })
  create(@Body() createContentDto: CreateContentDto) {
    // 不提供用户ID，让服务自动创建默认用户
    return this.contentService.create(createContentDto)
  }

  @Get()
  @ApiOperation({ summary: '获取内容列表' })
  @ApiResponse({ status: 200, description: '获取内容列表成功' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('contentType') contentType?: string,
    @Query('tags') tags?: string,
  ) {
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      contentType,
      tags: tags ? tags.split(',') : undefined,
    }

    return this.contentService.findAll(params)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个内容' })
  @ApiResponse({ status: 200, description: '获取内容成功' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新内容' })
  @ApiResponse({ status: 200, description: '内容更新成功' })
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除内容' })
  @ApiResponse({ status: 200, description: '内容删除成功' })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id)
  }
}