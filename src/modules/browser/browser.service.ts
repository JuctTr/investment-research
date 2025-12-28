import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import type { Browser, Page } from 'puppeteer';
import { PUPPETEER_CONFIG } from '@/shared/config/puppeteer.config';
import { sleep } from '@/shared/utils/sleep.util';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;
  private pagePool: Page[] = [];
  private readonly maxInstances = parseInt(process.env.PUPPETEER_MAX_INSTANCES, 10) || 3;
  private initPromise: Promise<Browser> | null = null;

  async onModuleDestroy() {
    await this.closeAllPages();
    await this.closeBrowser();
  }

  /**
   * 初始化浏览器实例(懒加载,仅在首次使用时调用)
   */
  private async initBrowser(): Promise<Browser> {
    // 如果已经在初始化中,返回同一个 Promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // 如果已经初始化完成,直接返回
    if (this.browser) {
      return this.browser;
    }

    this.initPromise = (async () => {
      try {
        this.logger.log('正在启动浏览器...');
        const browser = await puppeteer.launch({
          headless: PUPPETEER_CONFIG.headless,
          args: PUPPETEER_CONFIG.args,
        });

        this.browser = browser;
        this.logger.log(`浏览器已启动成功`);
        this.initPromise = null;
        return browser;
      } catch (error) {
        this.logger.error('启动浏览器失败:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * 获取页面实例(每次创建新页面)
   */
  async getPage(): Promise<Page> {
    if (!this.browser) {
      await this.initBrowser();
    }

    // 每次创建新页面（暂时禁用页面池复用，避免 Frame 脱离问题）
    const page = await this.browser!.newPage();

    // 设置 User-Agent
    await page.setUserAgent(PUPPETEER_CONFIG.userAgent);

    // 设置视口
    await page.setViewport({ width: 1920, height: 1080 });

    // 添加请求拦截器
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // 阻止图片、字体等资源加载,提升性能
      const resourceType = req.resourceType();
      if (['image', 'font', 'stylesheet'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    this.logger.debug(`新页面已创建`);
    return page;
  }

  /**
   * 关闭页面（不再复用）
   */
  async releasePage(page: Page) {
    try {
      await page.close();
      this.logger.debug(`页面已关闭`);
    } catch (error) {
      this.logger.warn('关闭页面失败:', error);
    }
  }

  /**
   * 关闭所有页面
   */
  private async closeAllPages() {
    for (const page of this.pagePool) {
      try {
        await page.close();
      } catch (error) {
        this.logger.warn('关闭页面失败:', error);
      }
    }
    this.pagePool = [];
  }

  /**
   * 关闭浏览器
   */
  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('浏览器已关闭');
    }
  }

  /**
   * 获取浏览器状态
   */
  getStatus() {
    return {
      isConnected: this.browser?.isConnected() || false,
      poolSize: this.pagePool.length,
      maxInstances: this.maxInstances,
    };
  }
}
