import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { XueqiuUserProfile, Prisma } from '@prisma/client';

export type CreateUserProfileDto = Prisma.XueqiuUserProfileCreateInput;

@Injectable()
export class UserProfileRepository {
  private readonly logger = new Logger(UserProfileRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert 用户资料(更新或插入)
   */
  async upsert(data: CreateUserProfileDto): Promise<XueqiuUserProfile> {
    try {
      const result = await this.prisma.xueqiuUserProfile.upsert({
        where: { uid: data.uid },
        update: {
          screenName: data.screenName,
          followersCount: data.followersCount,
          friendsCount: data.friendsCount,
          description: data.description,
          rawData: data.rawData as Prisma.InputJsonValue,
          lastCrawlAt: new Date(),
        },
        create: {
          uid: data.uid,
          screenName: data.screenName,
          followersCount: data.followersCount,
          friendsCount: data.friendsCount,
          description: data.description,
          rawData: data.rawData as Prisma.InputJsonValue,
        },
      });

      this.logger.debug(`用户资料已更新: ${result.uid}`);
      return result;
    } catch (error) {
      this.logger.error('更新用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 根据 UID 查询
   */
  async findByUid(uid: string): Promise<XueqiuUserProfile | null> {
    return this.prisma.xueqiuUserProfile.findUnique({
      where: { uid },
    });
  }

  /**
   * 分页查询
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.XueqiuUserProfileOrderByWithRelationInput;
  }): Promise<XueqiuUserProfile[]> {
    const { skip = 0, take = 100, orderBy = { lastCrawlAt: 'desc' } } = params;

    return this.prisma.xueqiuUserProfile.findMany({
      skip,
      take,
      orderBy,
    });
  }

  /**
   * 统计总数
   */
  async count(): Promise<number> {
    return this.prisma.xueqiuUserProfile.count();
  }
}
