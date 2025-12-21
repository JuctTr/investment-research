import { apiService } from './api'
import type { Content, ApiResponse, PaginatedResponse } from '@/types'

export class ContentService {
  // 获取内容列表
  async getContents(params?: {
    page?: number
    limit?: number
    contentType?: string
    tags?: string[]
  }): Promise<ApiResponse<PaginatedResponse<Content>>> {
    return apiService.get<PaginatedResponse<Content>>('/contents', params)
  }

  // 获取单个内容
  async getContent(id: string): Promise<ApiResponse<Content>> {
    return apiService.get<Content>(`/contents/${id}`)
  }

  // 创建内容
  async createContent(data: {
    title: string
    description?: string
    contentType: string
    tags: string[]
  }): Promise<ApiResponse<Content>> {
    return apiService.post<Content>('/contents', data)
  }

  // 更新内容
  async updateContent(
    id: string,
    data: Partial<Content>
  ): Promise<ApiResponse<Content>> {
    return apiService.put<Content>(`/contents/${id}`, data)
  }

  // 删除内容
  async deleteContent(id: string): Promise<ApiResponse<null>> {
    return apiService.delete<null>(`/contents/${id}`)
  }
}

export const contentService = new ContentService()