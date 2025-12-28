import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import type {
  WechatArticle,
  Prisma,
} from '@prisma/client';

/**
 * 微信公众号文章 Repository
 */
@Injectable()
export class WechatArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建文章
   */
  async create(data: Prisma.WechatArticleCreateInput): Promise<WechatArticle> {
    return this.prisma.wechatArticle.create({
      data,
    });
  }

  /**
   * 根据 articleId 查询文章
   */
  async findByArticleId(articleId: string): Promise<WechatArticle | null> {
    return this.prisma.wechatArticle.findUnique({
      where: { articleId },
    });
  }

  /**
   * 插入或更新单篇文章
   */
  async upsert(data: Prisma.WechatArticleUncheckedCreateInput): Promise<WechatArticle> {
    try {
      // 直接创建，如果已存在会抛出唯一约束错误
      return await this.prisma.wechatArticle.create({
        data: {
          articleId: data.articleId,
          accountId: data.accountId,
          title: data.title,
          author: data.author,
          digest: data.digest,
          content: data.content,
          contentHtml: data.contentHtml,
          coverUrl: data.coverUrl,
          sourceUrl: data.sourceUrl,
          publishTime: data.publishTime,
          readCount: data.readCount ?? 0,
          likeCount: data.likeCount ?? 0,
          commentCount: data.commentCount ?? 0,
          rewardCount: data.rewardCount ?? 0,
          isOriginal: data.isOriginal ?? false,
          copyrightStat: data.copyrightStat ?? 0,
          rawData: data.rawData,
        },
      });
    } catch (error: any) {
      // 如果是唯一约束冲突，则更新
      if (error.code === 'P2002') {
        return await this.prisma.wechatArticle.update({
          where: { articleId: data.articleId },
          data: {
            title: data.title,
            author: data.author,
            digest: data.digest,
            content: data.content,
            contentHtml: data.contentHtml,
            coverUrl: data.coverUrl,
            sourceUrl: data.sourceUrl,
            publishTime: data.publishTime,
            readCount: data.readCount ?? 0,
            likeCount: data.likeCount ?? 0,
            commentCount: data.commentCount ?? 0,
            rewardCount: data.rewardCount ?? 0,
            isOriginal: data.isOriginal ?? false,
            copyrightStat: data.copyrightStat ?? 0,
            rawData: data.rawData,
          },
        });
      }
      throw error;
    }
  }

  /**
   * 批量插入或更新文章
   */
  async upsertMany(data: Prisma.WechatArticleCreateManyInput[]): Promise<{ count: number }> {
    return this.prisma.wechatArticle.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 查询公众号文章列表
   */
  async findByAccountId(
    accountId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.WechatArticleOrderByWithRelationInput;
      startDate?: Date;
      endDate?: Date;
      keyword?: string;
    } = {}
  ): Promise<{ items: WechatArticle[]; total: number }> {
    const {
      skip = 0,
      take = 20,
      orderBy = { publishTime: 'desc' as const },
      startDate,
      endDate,
      keyword,
    } = options;

    const where: Prisma.WechatArticleWhereInput = {
      accountId,
      ...(startDate && { publishTime: { gte: startDate } }),
      ...(endDate && { publishTime: { lte: endDate } }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { digest: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.wechatArticle.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.wechatArticle.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 获取公众号最新文章的发布时间
   */
  async getLatestPublishTime(accountId: string): Promise<Date | null> {
    const article = await this.prisma.wechatArticle.findFirst({
      where: { accountId },
      orderBy: { publishTime: 'desc' },
      select: { publishTime: true },
    });

    return article?.publishTime ?? null;
  }

  /**
   * 根据时间范围查询文章
   */
  async findByDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    options: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.WechatArticleOrderByWithRelationInput;
    } = {}
  ): Promise<{ items: WechatArticle[]; total: number }> {
    const { skip = 0, take = 20, orderBy = { publishTime: 'desc' as const } } = options;

    const where: Prisma.WechatArticleWhereInput = {
      accountId,
      publishTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.wechatArticle.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.wechatArticle.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 统计公众号文章数量
   */
  async countByAccountId(accountId: string): Promise<number> {
    return this.prisma.wechatArticle.count({
      where: { accountId },
    });
  }

  /**
   * 删除文章
   */
  async delete(id: string): Promise<WechatArticle> {
    return this.prisma.wechatArticle.delete({
      where: { id },
    });
  }

  /**
   * 批量删除公众号文章
   */
  async deleteByAccountId(accountId: string): Promise<{ count: number }> {
    return this.prisma.wechatArticle.deleteMany({
      where: { accountId },
    });
  }

  /**
   * 搜索文章
   */
  async search(params: {
    keyword: string;
    skip?: number;
    take?: number;
    accountIds?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ items: WechatArticle[]; total: number }> {
    const { keyword, skip = 0, take = 20, accountIds, startDate, endDate } = params;

    const where: Prisma.WechatArticleWhereInput = {
      ...(accountIds && { accountId: { in: accountIds } }),
      ...(startDate || endDate ? {
        publishTime: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      } : {}),
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { digest: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.wechatArticle.findMany({
        where,
        skip,
        take,
        orderBy: { publishTime: 'desc' },
      }),
      this.prisma.wechatArticle.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 检查文章是否存在
   */
  async exists(articleId: string): Promise<boolean> {
    const count = await this.prisma.wechatArticle.count({
      where: { articleId },
    });
    return count > 0;
  }

  /**
   * 更新文章统计数据
   */
  async updateStats(
    articleId: string,
    stats: {
      readCount?: number;
      likeCount?: number;
      commentCount?: number;
      rewardCount?: number;
    }
  ): Promise<WechatArticle> {
    return this.prisma.wechatArticle.update({
      where: { articleId },
      data: stats,
    });
  }
}
