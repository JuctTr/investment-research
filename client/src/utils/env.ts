/**
 * 环境判断工具函数
 * 用于区分服务端和客户端运行环境
 */

/**
 * 判断当前是否在服务端环境运行
 * @returns boolean - 服务端返回 true，客户端返回 false
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * 判断当前是否在客户端环境运行
 * @returns boolean - 客户端返回 true，服务端返回 false
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 安全地执行仅在客户端运行的代码
 * @param fn - 要执行的函数
 */
export function runOnClient(fn: () => void): void {
  if (isClient()) {
    fn();
  }
}

/**
 * 安全地执行仅在服务端运行的代码
 * @param fn - 要执行的函数
 */
export function runOnServer(fn: () => void): void {
  if (isServer()) {
    fn();
  }
}
