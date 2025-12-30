// 用户相关类型
export interface User {
  id: string
  email: string
  name: string
  role?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

// 内容类型枚举
export enum ContentType {
  ARTICLE = 'ARTICLE', // 文章
  NEWS = 'NEWS', // 新闻
  REPORT = 'REPORT', // 研报
  BOOK = 'BOOK', // 书籍
  VIDEO = 'VIDEO', // 视频
  PODCAST = 'PODCAST', // 播客
  NOTE = 'NOTE', // 笔记
}

// 内容模型
export interface Content {
  id: string
  title: string
  description?: string
  url?: string
  content?: string
  contentType: ContentType
  tags: string[]
  createdAt: string
  updatedAt: string
  userId: string
}

// 市场展望枚举
export enum OutlookType {
  BULLISH = 'BULLISH', // 看涨
  BEARISH = 'BEARISH', // 看跌
  NEUTRAL = 'NEUTRAL', // 中性
}

// 观点模型
export interface Viewpoint {
  id: string
  title: string
  summary: string
  analysis: string
  confidence: number // 1-10
  outlook: OutlookType
  tags: string[]
  createdAt: string
  updatedAt: string
  userId: string
  contentId?: string
}

// 行动类型枚举
export enum ActionType {
  BUY = 'BUY', // 买入
  SELL = 'SELL', // 卖出
  HOLD = 'HOLD', // 持有
}

// 决策状态枚举
export enum DecisionStatus {
  PLANNING = 'PLANNING', // 计划中
  EXECUTED = 'EXECUTED', // 已执行
  COMPLETED = 'COMPLETED', // 已完成
  CANCELLED = 'CANCELLED', // 已取消
}

// 决策模型
export interface Decision {
  id: string
  title: string
  description: string
  action: ActionType
  amount: number
  price?: number
  reason: string
  status: DecisionStatus
  confidence: number // 1-10
  createdAt: string
  updatedAt: string
  userId: string
  viewpointId?: string
}

// 复盘结果枚举
export enum ReviewResult {
  PROFIT = 'PROFIT', // 盈利
  LOSS = 'LOSS', // 亏损
  NEUTRAL = 'NEUTRAL', // 持平
  PENDING = 'PENDING', // 待定
}

// 复盘模型
export interface Review {
  id: string
  title: string
  summary: string
  result: ReviewResult
  profit?: number
  profitRate?: number
  lesson: string
  mistakes?: string
  improvements?: string
  createdAt: string
  updatedAt: string
  userId: string
  decisionId?: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}