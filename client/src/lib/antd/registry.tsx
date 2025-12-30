'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type { ReactNode } from 'react';

type AntdRegistryProps = {
  children: ReactNode;
};

/**
 * Ant Design SSR Registry 组件
 *
 * 功能：
 * 1. 收集服务端渲染时生成的样式
 * 2. 在 HTML 中插入内联样式，避免 FOUC（Flash of Unstyled Content）
 * 3. 客户端水合时复用已有样式，避免重复加载
 *
 * 使用方式：
 * ```tsx
 * <AntdRegistry>
 *   <YourApp />
 * </AntdRegistry>
 * ```
 */
export default function AntdRegistry({ children }: AntdRegistryProps) {
  const cache = createCache();

  // 在服务端渲染时，将样式插入到 HTML 中
  useServerInsertedHTML(() => {
    return (
      <style
        dangerouslySetInnerHTML={{
          // extractStyle 从缓存中提取所有样式
          __html: extractStyle(cache),
        }}
      />
    );
  });

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}
