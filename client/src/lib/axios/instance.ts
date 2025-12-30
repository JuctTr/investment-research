import { isServer } from '@/utils/env';
import { getClientInstance } from './client';
import { getServerInstance } from './server';
import type { AxiosInstance } from 'axios';

/**
 * Axios 实例工厂函数
 *
 * 根据运行环境返回对应的 Axios 实例：
 * - 服务端：返回服务端实例（使用环境变量）
 * - 客户端：返回客户端实例（使用 localStorage + 自动刷新 Token）
 *
 * @returns AxiosInstance
 *
 * @example
 * ```ts
 * import { getRequestInstance } from '@/lib/axios/instance';
 *
 * const axios = getRequestInstance();
 * const response = await axios.get('/users');
 * ```
 */
export function getRequestInstance(): AxiosInstance {
  if (isServer()) {
    return getServerInstance();
  }
  return getClientInstance();
}

/**
 * 获取服务端专用 Axios 实例
 * 用于明确指定在服务端使用的场景
 */
export function getServerRequestInstance(): AxiosInstance {
  return getServerInstance();
}

/**
 * 获取客户端专用 Axios 实例
 * 用于明确指定在客户端使用的场景
 */
export function getClientRequestInstance(): AxiosInstance {
  return getClientInstance();
}
