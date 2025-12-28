import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { SogouWechatArticle, SogouWechatAccount } from '../types/wechat.types';
import type { Prisma } from '@prisma/client';
import type { ArticleRawData, ArticleDetail } from '../types/wechat.types';

/**
 * 微信 URL 参数
 */
export interface WechatUrlParameters {
  bizId?: string;
  mid?: string;
  idx?: string;
  sn?: string;
  chksm?: string;
}

/**
 * 微信公众号内容解析服务
 *
 * 负责解析微信公众号相关的内容，包括：
 * - 内容哈希计算（用于去重）
 * - URL 参数解析
 * - HTML 清洗
 * - 纯文本提取
 */
@Injectable()
export class WechatParserService {
  private readonly logger = new Logger(WechatParserService.name);

  /**
   * 计算内容哈希（用于去重检测）
   * @param content 内容字符串
   * @returns SHA256 哈希值
   */
  async calculateContentHash(content: string): Promise<string> {
    if (!content) {
      return '';
    }
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 提取微信文章 URL 中的关键参数
   * @param url 微信文章 URL
   * @returns URL 参数对象
   */
  parseUrlParameters(url: string): WechatUrlParameters {
    const params: WechatUrlParameters = {};

    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;

      // 微信文章 URL 中的关键参数
      params.bizId = searchParams.get('__biz') || undefined;
      params.mid = searchParams.get('mid') || undefined;
      params.idx = searchParams.get('idx') || undefined;
      params.sn = searchParams.get('sn') || undefined;
      params.chksm = searchParams.get('chksm') || undefined;

      // 有些 URL 使用 hash 格式
      if (!params.bizId && url.includes('__biz=')) {
        const bizMatch = url.match(/__biz=([^&]+)/);
        if (bizMatch) {
          params.bizId = bizMatch[1];
        }
      }

      if (!params.mid && url.includes('mid=')) {
        const midMatch = url.match(/mid=([^&]+)/);
        if (midMatch) {
          params.mid = midMatch[1];
        }
      }

      if (!params.idx && url.includes('idx=')) {
        const idxMatch = url.match(/idx=([^&]+)/);
        if (idxMatch) {
          params.idx = idxMatch[1];
        }
      }

      if (!params.sn && url.includes('sn=')) {
        const snMatch = url.match(/sn=([^&]+)/);
        if (snMatch) {
          params.sn = snMatch[1];
        }
      }
    } catch (error) {
      this.logger.warn(`解析 URL 参数失败: ${error.message}`);
    }

    return params;
  }

  /**
   * 从 URL 生成唯一的文章 ID
   * 优先使用 __biz+mid+idx+sn 组合，其次使用 URL 的哈希
   * @param url 文章 URL
   * @returns 文章唯一标识
   */
  generateArticleId(url: string): string {
    const params = this.parseUrlParameters(url);

    // 如果有完整的微信参数，组合生成
    if (params.bizId && params.mid && params.idx) {
      return `${params.bizId}_${params.mid}_${params.idx}`.substring(0, 100);
    }

    // 否则使用 URL 的哈希值
    return createHash('md5').update(url).digest('hex').substring(0, 100);
  }

  /**
   * 清洗 HTML 内容
   * @param html 原始 HTML
   * @returns 清洗后的 HTML
   */
  cleanHtml(html: string): string {
    if (!html) {
      return '';
    }

    return html
      // 移除 script 标签及其内容
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // 移除 style 标签及其内容
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // 移除 iframe 标签
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // 移除常见的微信广告和推广元素
      .replace(/<div[^>]*class="[^"]*qr_code[^"]*"[^>]*>.*?<\/div>/gi, '')
      .replace(/<div[^>]*class="[^"]*reward[^"]*"[^>]*>.*?<\/div>/gi, '')
      // 清理多余空白
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 提取纯文本内容
   * @param html HTML 内容
   * @returns 纯文本
   */
  extractText(html: string): string {
    if (!html) {
      return '';
    }

    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 解析搜狗搜索结果中的公众号信息
   */
  parseSogouAccount(html: string, accountId: string): SogouWechatAccount | null {
    try {
      // TODO: 实现具体的HTML解析逻辑
      // 这里先返回基本结构，后续实现具体的解析逻辑
      return {
        accountId,
        name: '',
        introduction: '',
        avatarUrl: '',
        followersCount: 0,
        publishCount: 0,
        lastPublishAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`解析公众号信息失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 解析搜狗搜索结果中的文章列表
   */
  parseSogouArticleList(html: string): SogouWechatArticle[] {
    try {
      // TODO: 实现具体的HTML解析逻辑
      // 这里先返回空数组，后续实现具体的解析逻辑
      return [];
    } catch (error) {
      this.logger.error(`解析文章列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 解析文章详情页内容
   */
  parseArticleDetail(html: string, articleId: string): Partial<SogouWechatArticle> | null {
    try {
      // TODO: 实现具体的HTML解析逻辑
      return {
        articleId,
        title: '',
        content: '',
        contentHtml: '',
      };
    } catch (error) {
      this.logger.error(`解析文章详情失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 清理HTML标签，提取纯文本内容
   */
  extractTextContent(html: string): string {
    return this.extractText(html);
  }

  /**
   * 提取文章摘要
   */
  extractDigest(content: string, maxLength = 200): string {
    const text = this.extractTextContent(content);
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * 标准化文章数据（从 ArticleRawData 转换）
   * @param raw 原始文章数据
   * @param detail 文章详情（可选）
   * @param accountId 数据库中的公众号ID（必须）
   * @returns 标准化的文章数据
   */
  normalizeArticleDataFromRaw(
    raw: ArticleRawData,
    detail?: ArticleDetail,
    accountId?: string,
  ): Prisma.WechatArticleUncheckedCreateInput {
    const articleId = this.generateArticleId(raw.url);
    const content = detail?.content || '';
    const contentHtml = detail?.contentHtml || '';

    return {
      articleId,
      accountId: accountId || raw.author,  // 使用传入的数据库ID
      title: raw.title,
      author: raw.author,
      digest: detail?.digest || raw.digest || this.extractDigest(content),
      content,
      contentHtml: this.cleanHtml(contentHtml),
      coverUrl: detail?.coverUrl || raw.coverUrl,
      sourceUrl: raw.url,
      publishTime: detail?.publishTime || raw.publishTime,
      readCount: 0,
      likeCount: 0,
      commentCount: 0,
      rewardCount: 0,
      isOriginal: false,
      copyrightStat: 0,
      rawData: { raw, detail } as any,
    };
  }

  /**
   * 标准化文章数据
   */
  normalizeArticleData(raw: SogouWechatArticle): Prisma.WechatArticleCreateManyInput {
    return {
      articleId: raw.articleId,
      accountId: raw.author,
      title: raw.title,
      author: raw.author,
      digest: raw.digest || this.extractDigest(raw.content),
      content: raw.content,
      contentHtml: this.cleanHtml(raw.contentHtml),
      coverUrl: raw.coverUrl,
      sourceUrl: raw.sourceUrl,
      publishTime: raw.publishTime,
      readCount: raw.readCount,
      likeCount: raw.likeCount,
      commentCount: raw.commentCount,
      rewardCount: raw.rewardCount,
      isOriginal: raw.isOriginal,
      copyrightStat: raw.copyrightStat,
      rawData: raw as any,
    };
  }

  /**
   * 标准化账号数据
   */
  normalizeAccountData(raw: SogouWechatAccount): Prisma.WechatAccountCreateManyInput {
    return {
      accountId: raw.accountId,
      name: raw.name,
      introduction: raw.introduction,
      avatarUrl: raw.avatarUrl,
      followersCount: raw.followersCount,
      publishCount: raw.publishCount,
      lastPublishAt: raw.lastPublishAt,
      rawData: raw as any,
    };
  }

  /**
   * 验证文章数据完整性
   */
  validateArticleData(data: Partial<SogouWechatArticle>): boolean {
    if (!data.articleId || !data.title || !data.sourceUrl) {
      this.logger.warn(`文章数据不完整: articleId=${data.articleId}, title=${data.title}`);
      return false;
    }
    return true;
  }

  /**
   * 验证账号数据完整性
   */
  validateAccountData(data: Partial<SogouWechatAccount>): boolean {
    if (!data.accountId || !data.name) {
      this.logger.warn(`账号数据不完整: accountId=${data.accountId}, name=${data.name}`);
      return false;
    }
    return true;
  }
}
