import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * 创建 React Query 客户端实例
 *
 * 配置说明：
 * - staleTime: 数据在指定时间内被视为新鲜，不会重新请求
 * - gcTime: 未使用的数据在内存中保留的时间（原 cacheTime）
 * - retry: 失败重试次数
 * - refetchOnWindowFocus: 窗口聚焦时是否重新获取数据
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 分钟
        gcTime: 5 * 60 * 1000, // 5 分钟
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        console.error('Query error:', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    }),
  });
}

// 客户端单例
let clientQueryClient: QueryClient | null = null;

/**
 * 获取客户端 QueryClient 单例
 */
export function getClientQueryClient(): QueryClient {
  if (!clientQueryClient) {
    clientQueryClient = createQueryClient();
  }
  return clientQueryClient;
}

/**
 * 重置客户端 QueryClient
 * 用于登出等场景，清除所有缓存
 */
export function resetClientQueryClient(): void {
  if (clientQueryClient) {
    clientQueryClient.clear();
  }
}
