import { getRequestInstance } from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types/auth.types';
import type { ApiResponse } from '@/types';

/**
 * 鉴权服务
 *
 * 提供登录、登出、Token 刷新等鉴权相关功能
 */
class AuthService {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const instance = getRequestInstance();
    const response = await instance.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  }

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<void>> {
    const instance = getRequestInstance();
    const response = await instance.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    const instance = getRequestInstance();
    const response = await instance.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      data
    );
    return response.data;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    const instance = getRequestInstance();
    const response = await instance.get<ApiResponse<LoginResponse['user']>>('/auth/me');
    return response.data;
  }

  /**
   * 保存 Token 到本地存储
   */
  saveTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    }
  }

  /**
   * 清除本地存储的 Token
   */
  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * 获取 Access Token
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * 获取 Refresh Token
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }
}

export const authService = new AuthService();
export default authService;
