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
   * 插入或更新单条动态
   */
  async upsert(data: Prisma.XueqiuStatusUncheckedCreateInput) {
    // 由于 Prisma upsert 的序列化问题，先尝试插入，如果存在则更新
    try {
      // 直接创建，如果已存在会抛出错误
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
    } catch (error) {
      // 如果是唯一约束冲突，则更新
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return await this.prisma.xueqiuStatus.update({
          where: { statusId: data.statusId },
          data: {
            content: data.content,
            rawText: data.rawText,
            expandedText: data.expandedText,
            targetCount: data.targetCount,
            commentCount: data.commentCount,
            likeCount: data.likeCount,
            repostCount: data.repostCount,
            pictures: data.pictures,
          },
        });
      }
      throw error;
    }
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
