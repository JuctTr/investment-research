import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import type { XueqiuStatus, Prisma } from '@prisma/client';

@Injectable()
export class StatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 批量插入或更新动态
   */
  async upsertMany(data: Prisma.XueqiuStatusCreateManyInput) {
    return this.prisma.xueqiuStatus.createMany({
      data: Array.isArray(data) ? data : [data],
      skipDuplicates: true,
    });
  }

  /**
   * 插入或更新单条动态（智能更新：仅当数据有变化时才更新）
   * 优化场景：大多数情况下是旧动态，先查询避免无效的INSERT尝试
   */
  async upsert(data: Prisma.XueqiuStatusUncheckedCreateInput) {
    // 先查询现有记录
    const existing = await this.prisma.xueqiuStatus.findUnique({
      where: { statusId: data.statusId },
      select: {
        content: true,
        rawText: true,
        expandedText: true,
        targetCount: true,
        commentCount: true,
        likeCount: true,
        repostCount: true,
        pictures: true,
      },
    });

    // 新记录：直接插入
    if (!existing) {
      return await this.prisma.xueqiuStatus.create({
        data: {
          statusId: data.statusId,
          userId: data.userId,
          content: data.content,
          rawText: data.rawText,
          expandedText: data.expandedText,
          createdAt: data.createdAt,
          targetCount: data.targetCount,
          commentCount: data.commentCount,
          likeCount: data.likeCount,
          repostCount: data.repostCount,
          pictures: data.pictures,
          rawData: data.rawData,
        },
      });
    }

    // 旧记录：比较差异，只更新有变化的字段
    const updateData: Partial<Prisma.XueqiuStatusUpdateInput> = {};

    // 比较文本内容
    if (existing.content !== data.content) {
      updateData.content = data.content;
    }
    if (existing.rawText !== data.rawText) {
      updateData.rawText = data.rawText;
    }
    if (existing.expandedText !== data.expandedText) {
      updateData.expandedText = data.expandedText;
    }

    // 比较数值字段
    if (existing.targetCount !== data.targetCount) {
      updateData.targetCount = data.targetCount;
    }
    if (existing.commentCount !== data.commentCount) {
      updateData.commentCount = data.commentCount;
    }
    if (existing.likeCount !== data.likeCount) {
      updateData.likeCount = data.likeCount;
    }
    if (existing.repostCount !== data.repostCount) {
      updateData.repostCount = data.repostCount;
    }

    // 比较图片数组（需要序列化后比较）
    const existingPicturesStr = JSON.stringify(existing.pictures?.sort());
    const newPicturesStr = JSON.stringify((data.pictures as string[])?.sort());
    if (existingPicturesStr !== newPicturesStr) {
      updateData.pictures = data.pictures;
    }

    // 如果没有任何变化，直接返回现有记录
    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    // 只更新有变化的字段
    return await this.prisma.xueqiuStatus.update({
      where: { statusId: data.statusId },
      data: updateData,
    });
  }

  /**
   * 查询用户的动态列表
   */
  async findByUserId(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.XueqiuStatusOrderByWithRelationInput;
    } = {}
  ) {
    const { skip = 0, take = 20, orderBy = { createdAt: 'desc' as const } } = options;

    const [items, total] = await Promise.all([
      this.prisma.xueqiuStatus.findMany({
        where: { userId },
        skip,
        take,
        orderBy,
      }),
      this.prisma.xueqiuStatus.count({ where: { userId } }),
    ]);

    return { items, total };
  }

  /**
   * 根据 statusId 查询
   */
  async findByStatusId(statusId: string) {
    return this.prisma.xueqiuStatus.findUnique({
      where: { statusId },
    });
  }

  /**
   * 获取用户最新动态的时间
   */
  async getLatestStatusTime(userId: string) {
    const status = await this.prisma.xueqiuStatus.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return status?.createdAt;
  }
}
