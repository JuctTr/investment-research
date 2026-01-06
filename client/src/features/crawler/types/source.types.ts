/**
 * 信息源类型定义
 */

/**
 * 信息源类型枚举
 */
export type SourceType =
  | "RSS"
  | "WECHAT"
  | "XUEQIU_USER_PROFILE"
  | "XUEQIU_USER_STATUSES"
  | "TWITTER"
  | "REDDIT"
  | "HACKERNEWS"
  | "CUSTOM";

/**
 * 健康状态枚举
 */
export type SourceHealthStatus = "HEALTHY" | "DEGRADED" | "DISABLED";

/**
 * 信息源实体
 */
export interface CrawlerSource {
  id: string;
  name: string;
  sourceType: SourceType;
  sourceUrl: string;
  enabled: boolean;
  fetchInterval: number;
  lastFetchAt: Date | null;
  lastEtag: string | null;
  authConfig: Record<string, any> | null;
  options: Record<string, any> | null;

  // 健康状态字段
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  healthStatus: SourceHealthStatus;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建信息源DTO
 */
export interface CreateSourceDto {
  name: string;
  sourceType: SourceType;
  sourceUrl: string;
  fetchInterval?: number;
  authConfig?: Record<string, any>;
  options?: Record<string, any>;
  enabled?: boolean;
}

/**
 * 更新信息源DTO
 */
export interface UpdateSourceDto {
  name?: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  fetchInterval?: number;
  authConfig?: Record<string, any>;
  options?: Record<string, any>;
  enabled?: boolean;
}

/**
 * 信息源列表查询参数
 */
export interface GetSourcesParams {
  page?: number;
  pageSize?: number;
  type?: SourceType;
  enabled?: boolean;
  keyword?: string;
}

/**
 * 信息源列表响应
 */
export interface GetSourcesResponse {
  data: CrawlerSource[];
  total: number;
}

/**
 * 创建信息源响应
 */
export interface CreateSourceResponse {
  success: true;
  data: CrawlerSource;
}

/**
 * 更新信息源响应
 */
export interface UpdateSourceResponse {
  success: true;
  data: CrawlerSource;
}

/**
 * 删除信息源响应
 */
export interface DeleteSourceResponse {
  success: true;
}

/**
 * 重置健康状态响应
 */
export interface ResetHealthResponse {
  success: true;
}

