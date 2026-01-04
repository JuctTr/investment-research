/**
 * 任务类型定义
 */

/**
 * 任务状态枚举
 */
export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

/**
 * 爬虫任务实体
 */
export interface CrawlerTask {
  id: string;
  sourceId: string;
  status: TaskStatus;
  progress: number;
  result?: Record<string, any>;
  error?: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建任务DTO
 */
export interface CreateTaskDto {
  sourceId: string;
  params?: Record<string, any>;
}

/**
 * 任务列表查询参数
 */
export interface GetTasksParams {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  sourceId?: string;
}

/**
 * 任务列表响应
 */
export interface GetTasksResponse {
  success: true;
  data: CrawlerTask[];
  total: number;
}

/**
 * 创建任务响应
 */
export interface CreateTaskResponse {
  success: true;
  data: CrawlerTask;
}

/**
 * 任务详情响应
 */
export interface GetTaskResponse {
  success: true;
  data: CrawlerTask;
}

/**
 * 取消任务响应
 */
export interface CancelTaskResponse {
  success: true;
  data: CrawlerTask;
}
