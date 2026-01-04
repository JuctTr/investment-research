'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 动态导入 MSW（仅在客户端和开发环境）
    if (process.env.NODE_ENV === 'development') {
      import('@/features/crawler/mocks/browser')
        .then(() => {
          console.log('[MSW] Mock Service Worker 已启动');
          setReady(true);
        })
        .catch((error) => {
          console.error('[MSW] 启动失败:', error);
          setReady(true); // 即使失败也继续
        });
    } else {
      setReady(true);
    }
  }, []);

  // MSW 启动前不渲染内容，避免请求漏过
  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
