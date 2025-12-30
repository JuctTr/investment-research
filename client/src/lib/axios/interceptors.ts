import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Token 管理接口
 */
export interface TokenManager {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
}

/**
 * 默认 Token 管理实现（基于 localStorage）
 */
export const defaultTokenManager: TokenManager = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  setAccessToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },
  setRefreshToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

/**
 * 设置请求拦截器
 */
export function setupRequestInterceptor(
  axiosInstance: AxiosInstance,
  tokenManager: TokenManager = defaultTokenManager
): void {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
}

/**
 * 设置响应拦截器
 */
export function setupResponseInterceptor(
  axiosInstance: AxiosInstance,
  tokenManager: TokenManager = defaultTokenManager
): void {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // 401 错误处理：Token 过期
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // 调用刷新 Token 接口
          const response = await axiosInstance.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data as { accessToken: string };

          tokenManager.setAccessToken(accessToken);

          // 重试原请求
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // 刷新失败，清除 Token
          tokenManager.clearTokens();

          // 跳转登录页
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

/**
 * 设置所有拦截器
 */
export function setupInterceptors(
  axiosInstance: AxiosInstance,
  tokenManager?: TokenManager
): void {
  setupRequestInterceptor(axiosInstance, tokenManager);
  setupResponseInterceptor(axiosInstance, tokenManager);
}
