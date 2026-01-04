/**
 * MSW 浏览器配置
 * 在开发环境下启动 Mock Service Worker
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * 创建 MSW Worker 实例
 */
export const worker = setupWorker(...handlers);

/**
 * 启动 MSW (仅在开发环境)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  worker.start({
    onUnhandledRequest: 'bypass',
    // 启用错误日志
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  }).then(() => {
    console.log('[MSW] Mock Service Worker 已启动');
  }).catch((error: Error) => {
    console.error('[MSW] 启动失败:', error);
  });
}

/**
 * 等待 MSW 启动完成 (用于测试)
 */
export const waitForWorker = () => worker.start();
