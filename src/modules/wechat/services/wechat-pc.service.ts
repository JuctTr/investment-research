import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer from 'puppeteer';
import type { Browser, Page, Target } from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ArticleRawData, ArticleDetail } from '../types/wechat.types';
import { WechatArticleRepository } from '../repositories/wechat-article.repository';
import { sleep } from '@/shared/utils/sleep.util';

const execAsync = promisify(exec);

/**
 * 获取历史消息的选项
 */
interface FetchOptions {
  /**
   * 最大滚动次数
   */
  maxScrolls?: number;

  /**
   * 每次滚动后等待时间(毫秒)
   */
  scrollWaitTime?: number;

  /**
   * 每次滚动距离(像素)
   */
  scrollDistance?: number;

  /**
   * 连续未发现新文章的次数阈值
   */
  stableThreshold?: number;

  /**
   * 是否解析文章详情
   */
  parseDetail?: boolean;
}

/**
 * CDP 目标信息
 */
interface CDPTarget {
  type: string;
  title: string;
  url: string;
  description?: string;
  webSocketDebuggerUrl: string;
}

/**
 * 微信 PC 客户端自动化服务
 *
 * 使用 Chrome DevTools Protocol (CDP) 连接到 macOS 微信客户端的 WebView
 * 支持获取历史消息和解析文章详情
 */
@Injectable()
export class WechatPcService implements OnModuleDestroy {
  private readonly logger = new Logger(WechatPcService.name);
  private browser: Browser | null = null;
  private readonly DEFAULT_CDP_PORT = 9222;

  constructor(private readonly articleRepository: WechatArticleRepository) {}

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * 连接到微信 PC 客户端的 CDP 端口
   * @param cdpPort CDP 端口号,默认 9222
   * @returns 是否连接成功
   */
  async connect(cdpPort?: number): Promise<boolean> {
    const port = cdpPort || this.DEFAULT_CDP_PORT;
    const cdpUrl = `http://localhost:${port}`;

    try {
      // 检查微信进程是否运行
      const isWechatRunning = await this.checkWechatProcess();
      if (!isWechatRunning) {
        this.logger.error('微信 PC 客户端未运行,请先启动微信');
        return false;
      }

      // 检查 CDP 端口是否可用
      const isCdpAvailable = await this.checkCdpPort(cdpUrl);
      if (!isCdpAvailable) {
        this.logger.error(`CDP 端口 ${port} 不可用,请使用以下命令启动微信:
/Applications/WeChat.app/Contents/MacOS/WeChat --remote-debugging-port=${port}`);
        return false;
      }

      // 连接到 CDP
      this.logger.log(`正在连接到微信 CDP: ${cdpUrl}`);
      this.browser = await puppeteer.connect({
        browserURL: cdpUrl,
        defaultViewport: null,
      });

      this.logger.log('已成功连接到微信 PC 客户端');
      return true;
    } catch (error) {
      this.logger.error(`连接微信 CDP 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 断开 CDP 连接
   */
  async disconnect(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.disconnect();
        this.browser = null;
        this.logger.log('已断开微信 CDP 连接');
      } catch (error) {
        this.logger.warn(`断开连接时出现错误: ${error.message}`);
      }
    }
  }

  /**
   * 检查是否已连接
   */
  async isConnected(): Promise<boolean> {
    if (!this.browser) {
      return false;
    }

    try {
      // 尝试获取版本信息来验证连接
      const version = await this.browser.version();
      return !!version;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取历史消息
   * @param accountId 公众号 ID
   * @param options 获取选项
   * @returns 文章原始数据列表
   */
  async fetchHistoryMessages(
    accountId: string,
    options: FetchOptions = {},
  ): Promise<ArticleRawData[]> {
    const {
      maxScrolls = 50,
      scrollWaitTime = 2000,
      scrollDistance = 500,
      stableThreshold = 5,
      parseDetail = false,
    } = options;

    // 确保已连接
    if (!(await this.isConnected())) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('无法连接到微信 PC 客户端');
      }
    }

    try {
      // 查找公众号的 WebView
      const page = await this.findWechatAccountPage(accountId);
      if (!page) {
        throw new Error(`未找到公众号 ${accountId} 的聊天页面`);
      }

      this.logger.log(`开始获取公众号 ${accountId} 的历史消息`);

      const articlesMap = new Map<string, ArticleRawData>();
      let stableCount = 0;
      let scrollCount = 0;

      // 滚动加载历史消息
      while (stableCount < stableThreshold && scrollCount < maxScrolls) {
        // 滚动到页面底部
        await page.evaluate((distance) => {
          window.scrollBy(0, distance);
        }, scrollDistance);

        scrollCount++;
        this.logger.debug(`滚动第 ${scrollCount} 次,等待内容加载...`);

        // 等待内容加载
        await sleep(scrollWaitTime);

        // 提取当前可见的文章
        const newArticles = await this.extractArticles(page, accountId);
        let newCount = 0;

        for (const article of newArticles) {
          if (!articlesMap.has(article.url)) {
            articlesMap.set(article.url, article);
            newCount++;
          }
        }

        this.logger.debug(`本次滚动发现 ${newCount} 篇新文章,累计 ${articlesMap.size} 篇`);

        // 检查是否有新文章
        if (newCount === 0) {
          stableCount++;
          this.logger.debug(`连续 ${stableCount} 次未发现新文章`);
        } else {
          stableCount = 0;
        }
      }

      this.logger.log(`滚动完成,共发现 ${articlesMap.size} 篇文章`);

      // 转换为数组并按发布时间排序
      const articles = Array.from(articlesMap.values()).sort(
        (a, b) => b.publishTime.getTime() - a.publishTime.getTime(),
      );

      // 可选:解析文章详情
      if (parseDetail) {
        this.logger.log('开始解析文章详情...');
        for (let i = 0; i < articles.length; i++) {
          try {
            this.logger.debug(`解析文章 ${i + 1}/${articles.length}: ${articles[i].title}`);
            const detail = await this.parseArticle(articles[i].url);
            // 合并详情数据
            articles[i].digest = detail.digest || articles[i].digest;
            // 可以在这里添加更多字段
          } catch (error) {
            this.logger.warn(`解析文章详情失败: ${error.message}`);
          }
        }
      }

      return articles;
    } catch (error) {
      this.logger.error(`获取历史消息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析文章详情
   * @param pageUrl 文章 URL
   * @returns 文章详情
   */
  async parseArticle(pageUrl: string): Promise<ArticleDetail> {
    // 确保已连接
    if (!(await this.isConnected())) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('无法连接到微信 PC 客户端');
      }
    }

    let articlePage: Page | null = null;

    try {
      // 创建新页面打开文章
      articlePage = await this.browser!.newPage();

      this.logger.debug(`正在打开文章: ${pageUrl}`);
      await articlePage.goto(pageUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // 等待文章内容加载
      await sleep(2000);

      // 提取文章详情
      const detail = await articlePage.evaluate(() => {
        // 标题
        const titleElement = document.querySelector('.rich_media_title');
        const title = titleElement?.textContent?.trim() || '';

        // 作者
        const authorElement = document.querySelector('#js_author_name');
        const author = authorElement?.textContent?.trim() || '';

        // 发布时间
        const timeElement = document.querySelector('#publish_time');
        const publishTimeText = timeElement?.textContent?.trim() || '';
        let publishTime = new Date();
        if (publishTimeText) {
          // 微信文章的时间格式通常是 "2023-12-28" 或 "12月28日"
          const parsed = new Date(publishTimeText);
          if (!isNaN(parsed.getTime())) {
            publishTime = parsed;
          }
        }

        // 封面图
        const coverElement = document.querySelector('#js_cover');
        const coverUrl = coverElement?.getAttribute('data-src') || '';

        // 摘要
        const digestElement = document.querySelector('#js_content');
        const digest = digestElement?.textContent?.slice(0, 200) || '';

        // 内容 HTML
        const contentElement = document.querySelector('#js_content');
        const contentHtml = contentElement?.innerHTML || '';

        // 纯文本内容
        const content = contentElement?.textContent || '';

        return {
          title,
          author,
          publishTime,
          coverUrl,
          digest,
          content,
          contentHtml,
          sourceUrl: window.location.href,
        };
      });

      this.logger.debug(`文章解析完成: ${detail.title}`);

      return detail;
    } catch (error) {
      this.logger.error(`解析文章详情失败: ${error.message}`);
      throw error;
    } finally {
      // 关闭文章页面
      if (articlePage) {
        try {
          await articlePage.close();
        } catch (error) {
          this.logger.warn(`关闭文章页面失败: ${error.message}`);
        }
      }
    }
  }

  /**
   * 检查微信进程是否运行
   */
  private async checkWechatProcess(): Promise<boolean> {
    try {
      // macOS 使用 pgrep 检查进程
      const { stdout } = await execAsync('pgrep -f "WeChat"');
      return !!stdout.trim();
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查 CDP 端口是否可用
   */
  private async checkCdpPort(cdpUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${cdpUrl}/json`);
      if (!response.ok) {
        return false;
      }

      const targets: CDPTarget[] = await response.json();
      return Array.isArray(targets);
    } catch (error) {
      this.logger.debug(`CDP 端口检查失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 查找公众号的聊天页面
   */
  private async findWechatAccountPage(accountId: string): Promise<Page | null> {
    if (!this.browser) {
      return null;
    }

    try {
      // 获取所有目标
      const targets = this.browser.targets();
      this.logger.debug(`当前共有 ${targets.length} 个 CDP 目标`);

      // 查找包含公众号 URL 的页面
      for (const target of targets) {
        try {
          const targetUrl = target.url();
          this.logger.debug(`检查目标: ${target.type()} - ${targetUrl}`);

          // 微信公众号页面的 URL 特征
          if (
            target.type() === 'page' &&
            targetUrl.includes('mp.weixin.qq.com')
          ) {
            this.logger.log(`找到公众号页面: ${targetUrl}`);

            // 获取页面实例
            const page = await target.page();
            if (page) {
              return page;
            }
          }
        } catch (error) {
          // 某些目标可能无法访问,跳过
          continue;
        }
      }

      this.logger.warn('未找到公众号页面,请确保已打开对应的公众号聊天窗口');
      return null;
    } catch (error) {
      this.logger.error(`查找公众号页面失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 从页面中提取文章列表
   */
  private async extractArticles(
    page: Page,
    accountId: string,
  ): Promise<ArticleRawData[]> {
    try {
      const articles = await page.evaluate(() => {
        const results: Array<{
          title: string;
          url: string;
          digest: string;
          publishTime: Date;
          author: string;
          coverUrl?: string;
        }> = [];

        // 微信公众号文章列表的选择器
        // 注意:实际的选择器需要根据微信的 HTML 结构调整
        const articleElements = document.querySelectorAll(
          '.weui_media_bd, .chat-item, .message',
        );

        articleElements.forEach((element) => {
          // 标题
          const titleElement =
            element.querySelector('.weui_media_title') ||
            element.querySelector('h4') ||
            element.querySelector('.title');
          const title = titleElement?.textContent?.trim();

          // URL
          const linkElement =
            element.querySelector('a') ||
            element.querySelector('[href]') ||
            element;
          const url = linkElement instanceof HTMLAnchorElement
            ? linkElement.href
            : linkElement.getAttribute('data-url') || '';

          // 摘要
          const digestElement =
            element.querySelector('.weui_media_desc') ||
            element.querySelector('.desc');
          const digest = digestElement?.textContent?.trim() || '';

          // 发布时间
          const timeElement =
            element.querySelector('.weui_media_extra_info') ||
            element.querySelector('.time');
          const publishTimeText = timeElement?.textContent?.trim() || '';
          const publishTime = new Date(publishTimeText);

          // 封面图
          const imgElement = element.querySelector('img');
          const coverUrl = imgElement?.getAttribute('src') || '';

          // 作者
          const author = accountId;

          if (title && url) {
            results.push({
              title,
              url,
              digest,
              publishTime,
              author,
              coverUrl,
            });
          }
        });

        return results;
      });

      this.logger.debug(`提取到 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`提取文章失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取所有可用的 WebView 列表
   */
  async getAvailableWebViews(): Promise<CDPTarget[]> {
    if (!this.browser) {
      throw new Error('未连接到微信 CDP');
    }

    try {
      const response = await fetch(`http://localhost:${this.DEFAULT_CDP_PORT}/json`);
      const targets: CDPTarget[] = await response.json();

      // 过滤出页面类型的 WebView
      return targets.filter((target) => target.type === 'page');
    } catch (error) {
      this.logger.error(`获取 WebView 列表失败: ${error.message}`);
      return [];
    }
  }
}
