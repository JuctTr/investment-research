'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { getClientQueryClient, resetClientQueryClient } from '@/lib/query';

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * React Query Provider 组件
 *
 * 功能：
 * 1. 提供 QueryClient 上下文
 * 2. 集成 React Query Devtools
 * 3. 支持服务端反水（Hydration）
 *
 * 注意：
 * - 使用单例模式确保只有一个 QueryClient 实例
 * - 服务端预取的数据通过 HydrationBoundary 传递
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // 使用单例模式确保客户端只有一个 QueryClient
  const [queryClient] = useState(() => getClientQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * 导出重置函数，用于登出等场景
 */
export { resetClientQueryClient };