import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CrawlerService } from "./crawler.service";
import { RateLimitService } from "./rate-limit.service";
import { CreateCrawlerTaskDto } from "./dto/create-crawler-task.dto";
import { CreateSourceDto } from "./dto/create-source.dto";
import { QuerySourcesDto } from "./dto/query-sources.dto";
import { QueryTasksDto } from "./dto/query-tasks.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

@ApiTags("爬虫管理")
@Controller("crawler")
export class CrawlerController {
  constructor(
    private readonly crawler: CrawlerService,
    private readonly rateLimit: RateLimitService,
  ) {}

  // ==================== 信息源管理 ====================

  @Get("sources")
  @ApiOperation({ summary: "获取信息源列表" })
  @ApiResponse({ status: 200, description: "成功返回信息源列表" })
  async getSources(@Query() query: QuerySourcesDto) {
    return this.crawler.getSources(query);
  }

  @Get("sources/:id")
  @ApiOperation({ summary: "获取信息源详情" })
  @ApiResponse({ status: 200, description: "成功返回信息源详情" })
  @ApiResponse({ status: 404, description: "信息源不存在" })
  async getSource(@Param("id") id: string) {
    const source = await this.crawler.getSource(id);
    return { success: true, data: source };
  }

  @Post("sources")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建信息源" })
  @ApiResponse({ status: 201, description: "信息源创建成功" })
  async createSource(@Body() dto: CreateSourceDto) {
    const source = await this.crawler.createSource(dto);
    return { success: true, data: source };
  }

  @Patch("sources/:id")
  @ApiOperation({ summary: "更新信息源" })
  @ApiResponse({ status: 200, description: "信息源更新成功" })
  @ApiResponse({ status: 404, description: "信息源不存在" })
  async updateSource(@Param("id") id: string, @Body() dto: UpdateSourceDto) {
    const source = await this.crawler.updateSource(id, dto);
    return { success: true, data: source };
  }

  @Delete("sources/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "删除信息源" })
  @ApiResponse({ status: 200, description: "信息源删除成功" })
  @ApiResponse({ status: 404, description: "信息源不存在" })
  async deleteSource(@Param("id") id: string) {
    return this.crawler.deleteSource(id);
  }

  @Post("sources/:id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "启动信息源爬取" })
  @ApiResponse({ status: 200, description: "任务已创建" })
  async startSource(@Param("id") id: string) {
    const task = await this.crawler.startSource(id);
    return { success: true, data: task };
  }

  @Post("sources/:id/stop")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "停止信息源爬取" })
  @ApiResponse({ status: 200, description: "任务已取消" })
  async stopSource(@Param("id") id: string) {
    return this.crawler.stopSource(id);
  }

  // ==================== 任务管理 ====================

  @Get("tasks")
  @ApiOperation({ summary: "获取任务列表" })
  @ApiResponse({ status: 200, description: "成功返回任务列表" })
  async getTasks(@Query() query: QueryTasksDto) {
    return this.crawler.getTasks(query);
  }

  @Get("tasks/:id")
  @ApiOperation({ summary: "获取任务详情" })
  @ApiResponse({ status: 200, description: "成功返回任务详情" })
  @ApiResponse({ status: 404, description: "任务不存在" })
  async getTask(@Param("id") id: string) {
    const task = await this.crawler.getTask(id);
    return { success: true, data: task };
  }

  @Post("tasks")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建任务" })
  @ApiResponse({ status: 201, description: "任务创建成功" })
  async createTask(@Body() dto: CreateCrawlerTaskDto) {
    const task = await this.crawler.createTask(dto);
    return { success: true, data: task };
  }

  @Post("tasks/:id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "取消任务" })
  @ApiResponse({ status: 200, description: "任务已取消" })
  @ApiResponse({ status: 400, description: "任务状态不允许取消" })
  async cancelTask(@Param("id") id: string) {
    const task = await this.crawler.cancelTask(id);
    return { success: true, data: task };
  }

  // ==================== 限流管理 ====================

  @Get("rate-limit/stats")
  @ApiOperation({ summary: "获取限流状态统计" })
  @ApiResponse({ status: 200, description: "成功返回限流状态" })
  async getRateLimitStats() {
    const stats = this.rateLimit.getStats();
    return { success: true, data: stats };
  }
}
