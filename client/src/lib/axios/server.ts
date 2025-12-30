import axios, { type AxiosInstance } from 'axios';

/**
 * 创建服务端 Axios 实例
 *
 * 服务端特点：
 * 1. 无法访问 localStorage
 * 2. 使用服务器端环境变量
 * 3. 从 Cookie 或请求头中获取 Token
 * 4. 不需要处理跨域问题
 */
export function createServerInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器：服务端从环境变量获取 Token（如果需要）
  instance.interceptors.request.use(
    (config) => {
      // 服务端可以从环境变量或 Cookie 中获取 Token
      // 这里预留接口，待后续实现
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：统一错误处理
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // 服务端不做自动 Token 刷新，直接返回错误
      return Promise.reject(error);
    }
  );

  return instance;
}

// 服务端不使用单例，每次创建新实例
export function getServerInstance(): AxiosInstance {
  return createServerInstance();
}
