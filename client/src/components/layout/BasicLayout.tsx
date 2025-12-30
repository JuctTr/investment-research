'use client';

import { Layout } from 'antd';
import type { ReactNode } from 'react';
import { SiderLayout } from './SiderLayout';
import { HeaderLayout } from './HeaderLayout';
import { ContentLayout } from './ContentLayout';

const { Content } = Layout;

type BasicLayoutProps = {
  children: ReactNode;
};

/**
 * 基础布局组件
 *
 * 经典的管理后台布局：Header + Sider + Content
 */
export function BasicLayout({ children }: BasicLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SiderLayout />
      <Layout style={{ marginLeft: 240 }}>
        <HeaderLayout />
        <ContentLayout>{children}</ContentLayout>
      </Layout>
    </Layout>
  );
}
