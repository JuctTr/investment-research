import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { BrowserService } from './browser.service';
import { CookieStatus, XueqiuCookie } from '@prisma/client';
import { sleep } from '@/shared/utils/sleep.util';

@Injectable()
export class CookiePoolService {
  private readonly logger = new Logger(CookiePoolService.name);
  private readonly COOKIE_TTL = 2 * 60 * 60 * 1000; // 2 小时
  private readonly XUEQIU_URL = 'https://xueqiu.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly browser: BrowserService
  ) {}

  /**
   * 获取有效 Cookie
   */
  async getCookie(forceRefresh = false): Promise<string> {
    // 如果不强制刷新,先尝试从数据库获取
    if (!forceRefresh) {
      const validCookie = await this.getValidCookieFromDB();
      if (validCookie) {
        return validCookie.cookie;
      }
    }

    // 无可用 Cookie,使用 Puppeteer 获取
    this.logger.warn('没有可用的 Cookie,正在获取新 Cookie...');
    return this.fetchNewCookie();
  }

  /**
   * 从数据库获取有效 Cookie
   */
  private async getValidCookieFromDB(): Promise<XueqiuCookie | null> {
    const now = new Date();

    const cookie = await this.prisma.xueqiuCookie.findFirst({
      where: {
        status: CookieStatus.ACTIVE,
        expiresAt: { gt: now },
        failCount: { lt: 3 }, // 失败次数少于3次
      },
      orderBy: { lastUsedAt: 'asc' }, // 使用最久未使用的
    });

    if (cookie) {
      // 更新最后使用时间
      await this.prisma.xueqiuCookie.update({
        where: { id: cookie.id },
        data: { lastUsedAt: now },
      });

      this.logger.debug(`复用 Cookie: ${cookie.id.substring(0, 8)}...`);
    }

    return cookie;
  }

  /**
   * 使用 Puppeteer 获取新 Cookie
   */
  private async fetchNewCookie(): Promise<string> {
    const page = await this.browser.getPage();

    try {
      this.logger.log('正在访问 xueqiu.com...');

      await page.goto(this.XUEQIU_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 等待页面加载完成
      await sleep(3000);

      // 提取所有 Cookie
      const cookies = await page.cookies();
      const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

      if (!cookieString.includes('xq_a_token')) {
        throw new Error('未能获取 xq_a_token');
      }

      // 保存到数据库
      const expiresAt = new Date(Date.now() + this.COOKIE_TTL);

      await this.prisma.xueqiuCookie.create({
        data: {
          cookie: cookieString,
          status: CookieStatus.ACTIVE,
          expiresAt,
        },
      });

      // 清理过期 Cookie
      await this.cleanExpiredCookies();

      this.logger.log(`新 Cookie 获取并保存成功。过期时间: ${expiresAt.toISOString()}`);

      // 归还页面
      await this.browser.releasePage(page);

      return cookieString;
    } catch (error) {
      this.logger.error('获取新 Cookie 失败:', error);
      await this.browser.releasePage(page);
      throw error;
    }
  }

  /**
   * 标记 Cookie 失效
   */
  async markCookieInvalid(cookieString: string) {
    // 查找对应 Cookie 记录
    const cookie = await this.prisma.xueqiuCookie.findFirst({
      where: { cookie: cookieString },
    });

    if (cookie) {
      await this.prisma.xueqiuCookie.update({
        where: { id: cookie.id },
        data: {
          status: CookieStatus.EXPIRED,
          failCount: { increment: 1 },
        },
      });

      this.logger.warn(`Cookie 已标记为失效: ${cookie.id.substring(0, 8)}...`);
    }
  }

  /**
   * 清理过期 Cookie
   */
  private async cleanExpiredCookies() {
    const now = new Date();

    const result = await this.prisma.xueqiuCookie.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { status: CookieStatus.EXPIRED }],
      },
    });

    if (result.count > 0) {
      this.logger.log(`已清理 ${result.count} 个过期 Cookie`);
    }
  }

  /**
   * 预热 Cookie 池
   */
  async warmUpPool(count: number = 2) {
    this.logger.log(`正在预热 Cookie 池,数量: ${count}`);

    for (let i = 0; i < count; i++) {
      try {
        await this.fetchNewCookie();
        await sleep(5000); // 间隔5秒
      } catch (error) {
        this.logger.error(`预热 Cookie 失败 (${i + 1}/${count}):`, error);
      }
    }

    this.logger.log('Cookie 池预热完成');
  }

  /**
   * 获取 Cookie 池状态
   */
  async getPoolStatus() {
    const [activeCount, expiredCount] = await Promise.all([
      this.prisma.xueqiuCookie.count({
        where: {
          status: CookieStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.xueqiuCookie.count({
        where: { status: CookieStatus.EXPIRED },
      }),
    ]);

    return {
      active: activeCount,
      expired: expiredCount,
      total: activeCount + expiredCount,
    };
  }
}
