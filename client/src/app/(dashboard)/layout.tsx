import { BasicLayout } from '@/components/layout';
import type { ReactNode } from 'react';

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * 仪表盘路由组布局
 *
 * 用于主应用页面，包含侧边栏和顶部导航
 * URL 中不包含 (dashboard) 段
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <BasicLayout>{children}</BasicLayout>;
}
