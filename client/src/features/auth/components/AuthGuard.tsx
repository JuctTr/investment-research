'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import type { Permission } from '../types/auth.types';

type AuthGuardProps = {
  children: ReactNode;
  permissions?: Permission[];
  requireAuth?: boolean;
};

/**
 * 路由守卫组件
 *
 * 功能：
 * - 检查用户是否已登录
 * - 检查用户是否拥有所需权限
 * - 未登录或无权限时进行跳转
 */
export function AuthGuard({
  children,
  permissions,
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const { hasPermission } = usePermission();

  useEffect(() => {
    // 检查登录状态
    if (requireAuth && !checkAuth()) {
      router.replace('/login');
      return;
    }

    // 检查权限
    if (permissions && permissions.length > 0 && !hasPermission(permissions)) {
      router.replace('/403');
      return;
    }
  }, [requireAuth, permissions, checkAuth, hasPermission, router]);

  // 加载中状态
  if (requireAuth && !checkAuth()) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 无权限状态
  if (permissions && permissions.length > 0 && !hasPermission(permissions)) {
    return null;
  }

  return <>{children}</>;
}
