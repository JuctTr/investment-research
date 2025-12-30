/**
 * Axios 模块导出
 *
 * 提供双运行时请求策略：
 * - 服务端：使用 server.ts 实例
 * - 客户端：使用 client.ts 实例（支持 Token 自动刷新）
 */

export { getRequestInstance, getServerRequestInstance, getClientRequestInstance } from './instance';
export { createClientInstance, getClientInstance } from './client';
export { createServerInstance, getServerInstance } from './server';
export { setupInterceptors, setupRequestInterceptor, setupResponseInterceptor, defaultTokenManager } from './interceptors';

export type { TokenManager } from './interceptors';
