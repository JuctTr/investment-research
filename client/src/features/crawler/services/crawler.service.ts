/**
 * 爬虫API服务类
 * 使用项目统一的 axios 基础设施
 */
import { getRequestInstance } from '@/lib/axios';
import type {
  CrawlerSource,
  CreateSourceDto,
  UpdateSourceDto,
  GetSourcesParams,
  GetSourcesResponse,
  CreateSourceResponse,
  UpdateSourceResponse,
  DeleteSourceResponse,
  CrawlerTask,
  CreateTaskDto,
  GetTasksParams,
  GetTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
} from '../types';

/**
 * 爬虫服务类 - 封装所有爬虫相关的API调用
 */
class CrawlerService {
  /**
   * 获取信息源列表
   */
  async getSources(params?: GetSourcesParams): Promise<GetSourcesResponse> {
    const api = getRequestInstance();
    const response = await api.get<GetSourcesResponse>('/crawler/sources', { params });
    return response.data;
  }

  /**
   * 获取单个信息源详情
   */
  async getSource(id: string): Promise<CrawlerSource> {
    const api = getRequestInstance();
    const response = await api.get<{ data: CrawlerSource }>(`/crawler/sources/${id}`);
    return response.data.data;
  }

  /**
   * 创建信息源
   */
  async createSource(dto: CreateSourceDto): Promise<CreateSourceResponse> {
    const api = getRequestInstance();
    const response = await api.post<CreateSourceResponse>('/crawler/sources', dto);
    return response.data;
  }

  /**
   * 更新信息源
   */
  async updateSource(id: string, dto: UpdateSourceDto): Promise<UpdateSourceResponse> {
    const api = getRequestInstance();
    const response = await api.patch<UpdateSourceResponse>(`/crawler/sources/${id}`, dto);
    return response.data;
  }

  /**
   * 删除信息源
   */
  async deleteSource(id: string): Promise<DeleteSourceResponse> {
    const api = getRequestInstance();
    const response = await api.delete<DeleteSourceResponse>(`/crawler/sources/${id}`);
    return response.data;
  }

  /**
   * 获取任务列表
   */
  async getTasks(params?: GetTasksParams): Promise<GetTasksResponse> {
    const api = getRequestInstance();
    const response = await api.get<GetTasksResponse>('/crawler/tasks', { params });
    return response.data;
  }

  /**
   * 获取任务详情
   */
  async getTask(id: string): Promise<GetTaskResponse> {
    const api = getRequestInstance();
    const response = await api.get<GetTaskResponse>(`/crawler/tasks/${id}`);
    return response.data;
  }

  /**
   * 创建任务
   */
  async createTask(dto: CreateTaskDto): Promise<GetTaskResponse> {
    const api = getRequestInstance();
    const response = await api.post<GetTaskResponse>('/crawler/tasks', dto);
    return response.data;
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string): Promise<CancelTaskResponse> {
    const api = getRequestInstance();
    const response = await api.post<CancelTaskResponse>(`/crawler/tasks/${id}/cancel`);
    return response.data;
  }

  /**
   * 启动信息源爬取
   */
  async startSource(id: string): Promise<GetTaskResponse> {
    const api = getRequestInstance();
    const response = await api.post<GetTaskResponse>(`/crawler/sources/${id}/start`);
    return response.data;
  }

  /**
   * 停止信息源爬取
   */
  async stopSource(id: string): Promise<DeleteSourceResponse> {
    const api = getRequestInstance();
    const response = await api.post<DeleteSourceResponse>(`/crawler/sources/${id}/stop`);
    return response.data;
  }

  /**
   * 重置信息源健康状态
   */
  async resetSourceHealth(id: string): Promise<{ success: true }> {
    const api = getRequestInstance();
    const response = await api.post<{ success: true }>(`/crawler/sources/${id}/reset-health`);
    return response.data;
  }
}

// 导出单例实例
export const crawlerService = new CrawlerService();
export default crawlerService;
