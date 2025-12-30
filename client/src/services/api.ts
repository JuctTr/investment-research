import type { AxiosInstance } from 'axios';
import { getRequestInstance } from '@/lib/axios';
import type { ApiResponse } from '@/types';

/**
 * API 服务类
 *
 * 使用双运行时 Axios 实例：
 * - 服务端：使用服务端实例
 * - 客户端：使用客户端实例（支持 Token 自动刷新）
 */
class ApiService {
  private getInstance(): AxiosInstance {
    return getRequestInstance();
  }

  /**
   * GET 请求
   * @param url - 请求路径
   * @param params - 查询参数
   * @returns Promise<ApiResponse<T>>
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const instance = this.getInstance();
    const response = await instance.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  /**
   * POST 请求
   * @param url - 请求路径
   * @param data - 请求体数据
   * @returns Promise<ApiResponse<T>>
   */
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const instance = this.getInstance();
    const response = await instance.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * PUT 请求
   * @param url - 请求路径
   * @param data - 请求体数据
   * @returns Promise<ApiResponse<T>>
   */
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const instance = this.getInstance();
    const response = await instance.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * DELETE 请求
   * @param url - 请求路径
   * @returns Promise<ApiResponse<T>>
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const instance = this.getInstance();
    const response = await instance.delete<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * PATCH 请求
   * @param url - 请求路径
   * @param data - 请求体数据
   * @returns Promise<ApiResponse<T>>
   */
  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const instance = this.getInstance();
    const response = await instance.patch<ApiResponse<T>>(url, data);
    return response.data;
  }
}

/**
 * API 服务单例
 */
export const apiService = new ApiService();
export default apiService;

/**
 * 直接导出 Axios 实例，用于需要直接使用 Axios 的场景
 */
export function getAxiosInstance(): AxiosInstance {
  return getRequestInstance();
}
