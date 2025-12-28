import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from '../../browser/browser.service';
import { sleep } from '@/shared/utils/sleep.util';
import type {
  AccountSearchResult,
  ArticleRawData,
  ArticleDetail,
} from '../types/wechat.types';

/**
 * 微信公众号搜狗搜索服务
 * 负责通过搜狗搜索入口获取公众号和文章数据
 */
@Injectable()
export class WechatSogouService {
  private readonly logger = new Logger(WechatSogouService.name);

  // 搜狗微信搜索相关URL
  private readonly SOGOU_SEARCH_URL = 'https://weixin.sogou.com/weixin?type=1&query=';
  private readonly SOGOU_BASE_URL = 'https://weixin.sogou.com';

  // 选择器配置
  private readonly SELECTORS = {
    // 搜索结果容器
    resultBox: '.news-box',
    // 公众号列表项
    accountItem: '.news-list li',
    // 公众号名称
    accountName: 'h3 a',
    // 公众号ID/微信号
    accountId: '.account-info',
    // 公众号简介
    introduction: '.account-info p',
    // 公众号头像
    avatar: 'img',
    // 认证信息
    verifyInfo: '.account-info .txt-box-1',
    // 最后发布时间
    lastPublishTime: '.account-info .s2',
    // 文章列表容器 - 修复：直接使用 .news-list，不需要外层 .news-box
    articleList: '.news-list',
    // 文章项
    articleItem: 'li',
    // 文章标题
    articleTitle: 'h3 a',
    // 文章摘要
    articleDigest: '.txt-info',
    // 文章发布时间
    articleTime: '.s2',
    // 文章封面
    articleCover: 'img',
    // 微信文章页面选择器
    wechatTitle: '.rich_media_title',
    wechatAuthor: '.rich_media_meta_text',
    wechatContent: '#js_content',
    wechatPublishTime: '#publish_time',
    wechatCover: '#meta_content img',
  } as const;

  constructor(private readonly browserService: BrowserService) {}

  /**
   * 搜索公众号
   * @param keyword 搜索关键词（公众号名称）
   * @returns 公众号搜索结果列表
   */
  async searchAccounts(keyword: string): Promise<AccountSearchResult[]> {
    let page;
    try {
      this.logger.log(`开始搜索公众号: ${keyword}`);

      // 获取浏览器页面
      page = await this.browserService.getPage();

      // 构建搜索URL
      const searchUrl = `${this.SOGOU_SEARCH_URL}${encodeURIComponent(keyword)}`;
      this.logger.debug(`访问搜索URL: ${searchUrl}`);

      // 访问搜索页面
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 随机延迟，模拟人类行为
      await this.randomDelay();

      // 等待搜索结果加载
      try {
        await page.waitForSelector(this.SELECTORS.resultBox, { timeout: 10000 });
      } catch (error) {
        this.logger.warn('搜索结果加载超时，可能未找到结果或页面结构变化');
        return [];
      }

      // 检查是否有验证码
      const hasCaptcha = await this.checkCaptcha(page);
      if (hasCaptcha) {
        this.logger.warn('检测到验证码，需要人工处理');
        throw new Error('搜索遇到验证码拦截，请稍后重试');
      }

      // 提取搜索结果
      const results = await page.evaluate((selectors) => {
        const items: AccountSearchResult[] = [];
        const accountElements = document.querySelectorAll(selectors.accountItem);

        accountElements.forEach((item) => {
          try {
            const nameEl = item.querySelector(selectors.accountName);
            const infoEl = item.querySelector(selectors.accountInfo);
            const introEl = item.querySelector(selectors.introduction);
            const avatarEl = item.querySelector(selectors.avatar);
            const verifyEl = item.querySelector(selectors.verifyInfo);
            const timeEl = item.querySelector(selectors.lastPublishTime);

            const name = nameEl?.textContent?.trim() || '';
            const accountId = infoEl?.textContent?.replace('微信号：', '')?.trim() || '';
            const introduction = introEl?.textContent?.trim() || '';
            const avatarUrl = avatarEl?.getAttribute('src') || '';
            const verifyInfo = verifyEl?.textContent?.trim() || '';

            // 解析最后发布时间
            let lastPublishTime: Date | undefined;
            const timeText = timeEl?.textContent?.trim();
            if (timeText) {
              try {
                lastPublishTime = new Date(timeText);
              } catch {
                // 时间解析失败，忽略
              }
            }

            if (name && accountId) {
              items.push({
                name,
                accountId,
                introduction,
                avatarUrl,
                verifyInfo: verifyInfo || undefined,
                lastPublishTime,
              });
            }
          } catch (error) {
            console.error('解析公众号项失败:', error);
          }
        });

        return items;
      }, this.SELECTORS);

      this.logger.log(`搜索完成，找到 ${results.length} 个公众号`);
      return results;
    } catch (error) {
      this.logger.error(`搜索公众号失败: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (page) {
        await this.browserService.releasePage(page);
      }
    }
  }

  /**
   * 获取公众号文章列表
   * @param accountId 公众号ID（微信号）
   * @param limit 获取数量限制
   * @returns 文章原始数据列表
   */
  async fetchArticles(accountId: string, limit = 10): Promise<ArticleRawData[]> {
    let page;
    try {
      this.logger.log(`[fetchArticles] 开始获取公众号文章: ${accountId}, 限制: ${limit}`);

      page = await this.browserService.getPage();

      // 构建文章列表URL - 使用 type=2 搜索文章
      const articlesUrl = `${this.SOGOU_BASE_URL}/weixin?type=2&query=${encodeURIComponent(accountId)}`;
      this.logger.log(`[fetchArticles] 访问文章列表URL: ${articlesUrl}`);

      // 获取页面响应状态
      let responseStatus = 0;
      page.on('response', (response) => {
        if (response.url().includes('weixin.sogou.com')) {
          responseStatus = response.status();
          this.logger.debug(`[fetchArticles] HTTP响应状态: ${responseStatus} - ${response.url()}`);
        }
      });

      await page.goto(articlesUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      this.logger.log(`[fetchArticles] 页面加载完成，当前URL: ${page.url()}`);

      await this.randomDelay();

      // 等待文章列表加载 - 增加超时时间到30秒
      try {
        this.logger.debug(`[fetchArticles] 等待选择器: ${this.SELECTORS.articleList}`);
        await page.waitForSelector(this.SELECTORS.articleList, { timeout: 30000 });
        this.logger.log(`[fetchArticles] 文章列表选择器加载成功`);
      } catch (error) {
        this.logger.error(`[fetchArticles] 文章列表加载超时，尝试获取页面内容进行调试`);

        // 获取页面内容用于调试
        try {
          const pageTitle = await page.title();
          const bodyText = await page.evaluate(() => {
            return document.body.innerText.substring(0, 500);
          });
          this.logger.error(`[fetchArticles] 页面标题: ${pageTitle}`);
          this.logger.error(`[fetchArticles] 页面内容(前500字符): ${bodyText}`);
        } catch (e) {
          this.logger.error(`[fetchArticles] 获取调试信息失败: ${e.message}`);
        }

        return [];
      }

      // 检查验证码
      const hasCaptcha = await this.checkCaptcha(page);
      if (hasCaptcha) {
        this.logger.warn('检测到验证码，需要人工处理');
        throw new Error('获取文章列表遇到验证码拦截，请稍后重试');
      }

      // 提取文章列表
      const rawResults = await page.evaluate((selectors, maxLimit) => {
        const items: any[] = [];
        const articleElements = document.querySelectorAll(selectors.articleItem);
        console.log(`[fetchArticles] 找到 ${articleElements.length} 个文章列表项`);

        let count = 0;
        articleElements.forEach((item) => {
          if (count >= maxLimit) return;

          try {
            const titleEl = item.querySelector(selectors.articleTitle);
            const digestEl = item.querySelector(selectors.articleDigest);
            const timeEl = item.querySelector(selectors.articleTime);
            const coverEl = item.querySelector(selectors.articleCover);

            const title = titleEl?.textContent?.trim() || '';
            let url = titleEl?.getAttribute('href') || '';
            const digest = digestEl?.textContent?.trim() || '';
            const coverUrl = coverEl?.getAttribute('src') || undefined;

            // 转换相对URL为绝对URL
            if (url && !url.startsWith('http')) {
              url = 'https://weixin.sogou.com' + url;
            }

            // 解析发布时间并转换为ISO字符串
            const timeText = timeEl?.textContent?.trim();
            let publishTimeIso: string;
            try {
              publishTimeIso = timeText ? new Date(timeText).toISOString() : new Date().toISOString();
            } catch {
              publishTimeIso = new Date().toISOString();
            }

            // 从URL中提取作者信息（搜狗URL中通常包含公众号名称）
            const author = ''; // 后续可通过解析获取

            if (title && url) {
              items.push({
                title,
                url,
                digest,
                publishTime: publishTimeIso,  // 使用ISO字符串而不是Date对象
                author,
                coverUrl,
              });
              count++;
            }
          } catch (error) {
            console.error('解析文章项失败:', error);
          }
        });

        return items;
      }, this.SELECTORS, limit);

      // 将ISO字符串转换回Date对象
      const results: ArticleRawData[] = rawResults.map(item => ({
        ...item,
        publishTime: new Date(item.publishTime),
      }));

      this.logger.log(`[fetchArticles] 获取文章列表完成，共 ${results.length} 篇`);
      if (results.length > 0) {
        this.logger.log(`[fetchArticles] 首篇文章标题: ${results[0].title}`);
        this.logger.log(`[fetchArticles] 首篇文章URL: ${results[0].url?.substring(0, 80)}...`);
      }
      return results;
    } catch (error) {
      this.logger.error(`获取文章列表失败: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (page) {
        await this.browserService.releasePage(page);
      }
    }
  }

  /**
   * 将搜狗临时链接转换为永久链接
   * @param tempUrl 搜狗临时链接
   * @returns 永久链接URL
   */
  async convertToPermanentUrl(tempUrl: string): Promise<string> {
    let page;
    try {
      this.logger.debug(`开始转换永久链接: ${tempUrl.substring(0, 50)}...`);

      page = await this.browserService.getPage();

      // 设置请求监听，捕获跳转后的URL
      const finalUrl = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('转换永久链接超时'));
        }, 15000);

        // 监听响应事件
        page.on('response', async (response) => {
          const url = response.url();
          // 检测是否跳转到微信文章永久链接
          if (url.includes('mp.weixin.qq.com')) {
            clearTimeout(timeout);
            resolve(url);
          }
        });

        // 访问临时链接
        page.goto(tempUrl, { waitUntil: 'networkidle2', timeout: 15000 })
          .then(() => {
            // 如果没有跳转，尝试从当前URL获取
            page.url().then((currentUrl) => {
              if (currentUrl.includes('mp.weixin.qq.com')) {
                clearTimeout(timeout);
                resolve(currentUrl);
              } else {
                clearTimeout(timeout);
                reject(new Error('未能获取永久链接'));
              }
            });
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

      this.logger.debug(`永久链接转换成功: ${finalUrl.substring(0, 50)}...`);
      return finalUrl;
    } catch (error) {
      this.logger.error(`转换永久链接失败: ${error.message}`);
      // 如果转换失败，返回原始URL
      return tempUrl;
    } finally {
      if (page) {
        await this.browserService.releasePage(page);
      }
    }
  }

  /**
   * 解析文章详情页内容
   * @param url 文章URL（永久链接）
   * @returns 文章详情
   */
  async parseArticle(url: string): Promise<ArticleDetail> {
    let page;
    try {
      this.logger.log(`开始解析文章详情: ${url.substring(0, 50)}...`);

      page = await this.browserService.getPage();

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay();

      // 等待内容加载
      try {
        await page.waitForSelector(this.SELECTORS.wechatContent, { timeout: 10000 });
      } catch (error) {
        this.logger.warn('文章内容加载超时');
        throw new Error('文章内容加载失败');
      }

      // 提取文章详情
      const rawDetail = await page.evaluate((selectors) => {
        const titleEl = document.querySelector(selectors.wechatTitle);
        const authorEl = document.querySelector(selectors.wechatAuthor);
        const contentEl = document.querySelector(selectors.wechatContent);
        const timeEl = document.querySelector(selectors.wechatPublishTime);
        const coverEl = document.querySelector(selectors.wechatCover);

        const title = titleEl?.textContent?.trim() || '';
        const author = authorEl?.textContent?.trim() || '';
        const contentHtml = contentEl?.innerHTML || '';
        const content = contentEl?.textContent?.trim() || '';
        const publishTimeStr = timeEl?.textContent?.trim() || '';
        const coverUrl = coverEl?.getAttribute('src') || undefined;

        // 解析发布时间并转换为ISO字符串
        let publishTimeIso: string;
        try {
          // 微信文章时间格式: "2023-12-01 10:30"
          publishTimeIso = publishTimeStr ? new Date(publishTimeStr.replace(/\s/g, 'T')).toISOString() : new Date().toISOString();
        } catch {
          publishTimeIso = new Date().toISOString();
        }

        // 生成摘要（取前200字）
        const digest = content.length > 200 ? content.substring(0, 200) + '...' : content;

        return {
          title,
          author,
          content,
          contentHtml,
          publishTime: publishTimeIso,  // 使用ISO字符串
          coverUrl,
          digest: digest || undefined,
          sourceUrl: window.location.href,
        };
      }, this.SELECTORS);

      // 将ISO字符串转换回Date对象
      const detail: ArticleDetail = {
        ...rawDetail,
        publishTime: new Date(rawDetail.publishTime),
      };

      this.logger.log(`文章详情解析完成: ${detail.title}`);
      return detail;
    } catch (error) {
      this.logger.error(`解析文章详情失败: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (page) {
        await this.browserService.releasePage(page);
      }
    }
  }

  /**
   * 检查页面是否有验证码
   * @param page 页面实例
   * @returns 是否有验证码
   */
  private async checkCaptcha(page: any): Promise<boolean> {
    try {
      // 检查常见的验证码元素
      const captchaSelectors = [
        '#seccodeDiv',
        '.verify-box',
        '.captcha',
        '[id*="captcha"]',
        '[class*="captcha"]',
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      // 检查页面文本是否包含验证码相关提示
      const bodyText = await page.evaluate(() => document.body.textContent);
      if (bodyText && (bodyText.includes('验证码') || bodyText.includes('captcha'))) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.debug(`检查验证码时出错: ${error.message}`);
      return false;
    }
  }

  /**
   * 随机延迟，模拟人类行为
   * @param minMs 最小毫秒数
   * @param maxMs 最大毫秒数
   */
  private async randomDelay(minMs = 2000, maxMs = 5000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    this.logger.debug(`随机延迟 ${delay}ms`);
    await sleep(delay);
  }
}
