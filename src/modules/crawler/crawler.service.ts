import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { CreateCrawlerTaskDto } from './dto/create-crawler-task.dto';
import { QuerySourcesDto } from './dto/query-sources.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

/**
 * 统一爬虫调度服务
 * 职责：管理信息源和爬取任务，不包含具体爬取实现
 */
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  // ==================== 信息源管理 ====================

  /**
   * 获取信息源列表
   */
  async getSources(query: QuerySourcesDto) {
    const { page = 1, pageSize = 20, type, enabled, keyword } = query;

    const where: any = {};

    if (type) {
      where.sourceType = type;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { sourceUrl: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.crawlerSource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crawlerSource.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 获取单个信息源详情
   */
  async getSource(id: string) {
    const source = await this.prisma.crawlerSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException(`信息源 ${id} 不存在`);
    }

    return source;
  }

  /**
   * 创建信息源
   */
  async createSource(dto: CreateSourceDto) {
    return this.prisma.crawlerSource.create({
      data: {
        name: dto.name,
        sourceType: dto.sourceType,
        sourceUrl: dto.sourceUrl,
        enabled: dto.enabled ?? false,
        fetchInterval: dto.fetchInterval ?? 3600,
        authConfig: dto.authConfig,
        options: dto.options,
      },
    });
  }

  /**
   * 更新信息源
   */
  async updateSource(id: string, dto: UpdateSourceDto) {
    const source = await this.getSource(id);

    return this.prisma.crawlerSource.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 删除信息源
   */
  async deleteSource(id: string) {
    await this.getSource(id);

    await this.prisma.crawlerSource.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * 启动信息源爬取
   */
  async startSource(id: string) {
    const source = await this.getSource(id);

    // 启用信息源
    await this.prisma.crawlerSource.update({
      where: { id },
      data: { enabled: true },
    });

    // 创建爬取任务
    const task = await this.prisma.crawlerTask.create({
      data: {
        sourceId: id,
        status: 'PENDING',
        scheduledAt: new Date(),
      },
    });

    // 将任务加入队列执行
    await this.queue.addSourceJob(id, source.sourceType, task.id);

    this.logger.log(`信息源 ${source.name} 的爬取任务已加入队列: ${task.id}`);

    return task;
  }

  /**
   * 停止信息源爬取
   */
  async stopSource(id: string) {
    const source = await this.getSource(id);

    // 禁用信息源
    await this.prisma.crawlerSource.update({
      where: { id },
      data: { enabled: false },
    });

    // 取消所有运行中和待处理的任务
    await this.prisma.crawlerTask.updateMany({
      where: {
        sourceId: id,
        status: { in: ['PENDING', 'RUNNING'] },
      },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    this.logger.log(`信息源 ${source.name} 已停止`);

    return { success: true };
  }

  // ==================== 任务管理 ====================

  /**
   * 获取任务列表
   */
  async getTasks(query: QueryTasksDto) {
    const { page = 1, pageSize = 20, status, sourceId } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (sourceId) {
      where.sourceId = sourceId;
    }

    const [data, total] = await Promise.all([
      this.prisma.crawlerTask.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              sourceType: true,
            },
          },
        },
      }),
      this.prisma.crawlerTask.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 获取任务详情
   */
  async getTask(id: string) {
    const task = await this.prisma.crawlerTask.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            sourceType: true,
            sourceUrl: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`任务 ${id} 不存在`);
    }

    return task;
  }

  /**
   * 创建任务
   */
  async createTask(dto: CreateCrawlerTaskDto) {
    // 验证信息源存在
    await this.getSource(dto.sourceId);

    return this.prisma.crawlerTask.create({
      data: {
        sourceId: dto.sourceId,
        status: 'PENDING',
        scheduledAt: dto.scheduledAt || new Date(),
      },
    });
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string) {
    const task = await this.getTask(id);

    if (!['PENDING', 'RUNNING'].includes(task.status)) {
      throw new Error('任务状态不允许取消');
    }

    return this.prisma.crawlerTask.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }
}
