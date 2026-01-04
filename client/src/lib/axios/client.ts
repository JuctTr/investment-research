import axios, { type AxiosInstance } from "axios";

/**
 * 创建客户端 Axios 实例
 *
 * 客户端特点：
 * 1. 可以安全地访问 localStorage 和 Cookie
 * 2. 需要处理跨域请求
 * 3. 需要处理 Token 存储和刷新
 */
export function createClientInstance(): AxiosInstance {
  const instance = axios.create({
    // 开发环境使用相对路径，让 MSW 能拦截请求
    // 生产环境使用完整 URL
    baseURL:
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
        : process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:3000/api/v1",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器：注入 Token
  instance.interceptors.request.use(
    (config) => {
      // 从 localStorage 读取 Token
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：处理错误
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 401 错误处理：Token 过期
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // 尝试刷新 Token
          const refreshToken = localStorage.getItem("refresh_token");
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data.data;
          localStorage.setItem("access_token", accessToken);

          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // 刷新失败，清除 Token 并跳转登录
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// 单例模式：确保只有一个客户端实例
let clientInstance: AxiosInstance | null = null;

export function getClientInstance(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = createClientInstance();
  }
  return clientInstance;
}
