'use client';

import { ConfigProvider, type ThemeConfig } from 'antd';
import { type ReactNode } from 'react';
import AntdRegistry from '@/lib/antd/registry';

type AntdProviderProps = {
  children: ReactNode;
};

/**
 * Ant Design 全局配置 Provider
 *
 * 功能：
 * 1. 集成 AntdRegistry 实现 SSR 样式收集
 * 2. 配置全局主题
 * 3. 配置全局组件属性
 */
const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
    },
  },
};

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </AntdRegistry>
  );
}