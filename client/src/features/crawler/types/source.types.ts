/**
 * 信息源类型定义
 */

/**
 * 信息源类型枚举
 */
export type SourceType =
  | "XUEQIU_USER"
  | "XUEQIU_STATUS"
  | "WECHAT"
  | "RSS"
  | "CUSTOM";

/**
 * 信息源实体
 */
export interface CrawlerSource {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  config?: Record<string, any>;
  enabled: boolean;
  lastFetchAt: Date | null;
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
  config?: Record<string, any>;
}

/**
 * 更新信息源DTO
 */
export interface UpdateSourceDto {
  name?: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  fetchInterval?: number;
  config?: Record<string, any>;
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
}

/**
 * 信息源列表响应
 */
export interface GetSourcesResponse {
  success: true;
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
