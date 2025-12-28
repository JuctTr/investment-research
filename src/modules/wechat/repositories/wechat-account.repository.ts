import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import type {
  WechatAccount,
  Prisma,
  AccountStatus,
  CrawlMode,
} from '@prisma/client';

/**
 * 微信公众号账户 Repository
 */
@Injectable()
export class WechatAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建公众号账户
   */
  async create(data: Prisma.WechatAccountCreateInput): Promise<WechatAccount> {
    return this.prisma.wechatAccount.create({
      data,
    });
  }

  /**
   * 根据 ID 查询公众号
   */
  async findById(id: string): Promise<WechatAccount | null> {
    return this.prisma.wechatAccount.findUnique({
      where: { id },
    });
  }

  /**
   * 根据 accountId 查询公众号
   */
  async findByAccountId(accountId: string): Promise<WechatAccount | null> {
    return this.prisma.wechatAccount.findUnique({
      where: { accountId },
    });
  }

  /**
   * 查询公众号（包含关联数据）
   */
  async findByIdWithRelations(
    id: string
  ): Promise<(WechatAccount & { _count?: { articles: number; crawlLogs: number } }) | null> {
    const account = await this.prisma.wechatAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            crawlLogs: true,
          },
        },
      },
    });

    return account;
  }

  /**
   * 更新公众号信息
   */
  async update(
    id: string,
    data: Prisma.WechatAccountUpdateInput
  ): Promise<WechatAccount> {
    const account = await this.findById(id);
    if (!account) {
      throw new NotFoundException(`公众号 ID ${id} 不存在`);
    }

    return this.prisma.wechatAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除公众号
   */
  async delete(id: string): Promise<WechatAccount> {
    const account = await this.findById(id);
    if (!account) {
      throw new NotFoundException(`公众号 ID ${id} 不存在`);
    }

    return this.prisma.wechatAccount.delete({
      where: { id },
    });
  }

  /**
   * 查询公众号列表
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.WechatAccountWhereInput;
    orderBy?: Prisma.WechatAccountOrderByWithRelationInput;
  }): Promise<{ items: WechatAccount[]; total: number }> {
    const { skip = 0, take = 20, where, orderBy = { createdAt: 'desc' } } = params;

    const [items, total] = await Promise.all([
      this.prisma.wechatAccount.findMany({
        skip,
        take,
        where,
        orderBy,
      }),
      this.prisma.wechatAccount.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * 批量查询启用的公众号
   */
  async findEnabledAccounts(options?: {
    status?: AccountStatus;
    crawlMode?: CrawlMode;
  }): Promise<WechatAccount[]> {
    const where: Prisma.WechatAccountWhereInput = {
      enabled: true,
      ...(options?.status && { status: options.status }),
      ...(options?.crawlMode && { crawlMode: options.crawlMode }),
    };

    return this.prisma.wechatAccount.findMany({
      where,
      orderBy: { lastCrawlAt: 'asc' }, // 优先爬取较久未爬的
    });
  }

  /**
   * 更新最后爬取时间
   */
  async updateLastCrawlTime(id: string): Promise<void> {
    await this.prisma.wechatAccount.update({
      where: { id },
      data: { lastCrawlAt: new Date() },
    });
  }

  /**
   * 更新最后发布时间
   */
  async updateLastPublishTime(id: string, publishTime: Date): Promise<void> {
    await this.prisma.wechatAccount.update({
      where: { id },
      data: { lastPublishAt: publishTime },
    });
  }

  /**
   * 增加文章计数
   */
  async incrementPublishCount(id: string, count = 1): Promise<void> {
    await this.prisma.wechatAccount.update({
      where: { id },
      data: {
        publishCount: {
          increment: count,
        },
      },
    });
  }

  /**
   * 更新粉丝数
   */
  async updateFollowersCount(id: string, count: number): Promise<void> {
    await this.prisma.wechatAccount.update({
      where: { id },
      data: { followersCount: count },
    });
  }

  /**
   * 批量创建或更新公众号
   */
  async upsertMany(
    data: Prisma.WechatAccountCreateManyInput[]
  ): Promise<{ count: number }> {
    return this.prisma.wechatAccount.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 统计公众号数量
   */
  async count(where?: Prisma.WechatAccountWhereInput): Promise<number> {
    return this.prisma.wechatAccount.count({ where });
  }

  /**
   * 检查公众号是否存在
   */
  async exists(accountId: string): Promise<boolean> {
    const count = await this.prisma.wechatAccount.count({
      where: { accountId },
    });
    return count > 0;
  }
}
