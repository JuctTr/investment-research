/**
 * React Query 模块导出
 *
 * 提供服务端和客户端的 QueryClient 配置
 */

export { createQueryClient, getClientQueryClient, resetClientQueryClient } from './client';
export { createServerQueryClient, createDehydratedState } from './server';
