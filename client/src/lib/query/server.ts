import { dehydrate, type DehydratedState, type QueryClient } from '@tanstack/react-query';
import { createQueryClient } from './client';

/**
 * 服务端创建 QueryClient 实例
 *
 * 注意：
 * - 服务端每次请求都应创建新的 QueryClient
 * - 避免不同请求之间的状态污染
 */
export function createServerQueryClient(): QueryClient {
  return createQueryClient();
}

/**
 * 获取服务端反水状态
 *
 * 用于将服务端预取的数据传递给客户端
 *
 * @example
 * ```tsx
 * // app/page.tsx (服务端组件)
 * import { createDehydratedState } from '@/lib/query/server';
 * import { HydrationBoundary } from '@tanstack/react-query';
 *
 * export default async function Page() {
 *   const queryClient = createServerQueryClient();
 *   await queryClient.prefetchQuery({
 *     queryKey: ['users'],
 *     queryFn: fetchUsers,
 *   });
 *
 *   const dehydratedState = createDehydratedState(queryClient);
 *
 *   return (
 *     <HydrationBoundary state={dehydratedState}>
 *       <UsersList />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export function createDehydratedState(queryClient: QueryClient): DehydratedState {
  return dehydrate(queryClient);
}
