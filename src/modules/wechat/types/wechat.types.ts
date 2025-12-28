import type { Prisma } from '@prisma/client';

// 重新导出 Prisma 类型
export type { WechatAccount, WechatArticle } from '@prisma/client';

/**
 * 微信公众号账户完整信息（包含关联数据）
 */
export type WechatAccountWithRelations = import('@prisma/client').WechatAccount & {
  _count?: {
    articles: number;
    crawlLogs: number;
  };
};

/**
 * 微信公众号文章完整信息（包含关联数据）
 */
export type WechatArticleWithAccount = import('@prisma/client').WechatArticle & {
  account: import('@prisma/client').WechatAccount;
};

/**
 * 搜狗搜索结果类型
 */
export interface SogouWechatArticle {
  articleId: string;
  title: string;
  author: string;
  digest: string;
  content: string;
  contentHtml: string;
  coverUrl: string;
  sourceUrl: string;
  publishTime: Date;
  readCount: number;
  likeCount: number;
  commentCount: number;
  rewardCount: number;
  isOriginal: boolean;
  copyrightStat: number;
}

/**
 * 搜狗公众号信息类型
 */
export interface SogouWechatAccount {
  accountId: string;
  name: string;
  introduction: string;
  avatarUrl: string;
  followersCount: number;
  publishCount: number;
  lastPublishAt: Date;
}

/**
 * 爬取任务上下文
 */
export interface CrawlTaskContext {
  accountId: string;
  crawlMode: 'SOGOU' | 'WECHAT_PC' | 'AUTO';
  incremental: boolean;
  maxPages: number;
  forceRefresh: boolean;
  lastPublishTime?: Date;
}

/**
 * 爬取结果
 */
export interface CrawlResult {
  success: boolean;
  articlesFetched: number;
  articlesStored: number;
  errorMessage?: string;
  errorStack?: string;
  duration: number;
  usedMode?: 'SOGOU' | 'WECHAT_PC';
}

/**
 * 队列任务数据类型
 */
export interface WechatCrawlJobData {
  accountId: string;
  crawlMode: 'SOGOU' | 'WECHAT_PC' | 'AUTO';
  incremental: boolean;
  maxPages: number;
  forceRefresh: boolean;
}

/**
 * Prisma 创建输入类型
 */
export type WechatAccountCreateInput = Prisma.WechatAccountCreateInput;
export type WechatArticleCreateInput = Prisma.WechatArticleCreateManyInput;

/**
 * 搜狗搜索公众号结果
 */
export interface AccountSearchResult {
  name: string;
  accountId: string;
  introduction: string;
  avatarUrl: string;
  verifyInfo?: string;
  lastPublishTime?: Date;
}

/**
 * 搜狗文章原始数据
 */
export interface ArticleRawData {
  title: string;
  url: string;
  digest: string;
  publishTime: Date;
  author: string;
  coverUrl?: string;
}

/**
 * 文章详情
 */
export interface ArticleDetail {
  title: string;
  author: string;
  content: string;
  contentHtml: string;
  publishTime: Date;
  coverUrl?: string;
  digest?: string;
  sourceUrl: string;
}
