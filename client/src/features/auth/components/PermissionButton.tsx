'use client';

import { Button, type ButtonProps } from 'antd';
import { usePermission } from '../hooks/usePermission';
import type { Permission } from '../types/auth.types';

type PermissionButtonProps = ButtonProps & {
  permissions: Permission[];
  requireAll?: boolean; // true: 需要所有权限, false: 需要任意一个权限
  noPermissionFallback?: React.ReactNode;
};

/**
 * 权限按钮组件
 *
 * 功能：
 * - 根据用户权限显示或隐藏按钮
 * - 支持需要全部权限或任意一个权限的模式
 */
export function PermissionButton({
  permissions,
  requireAll = true,
  noPermissionFallback = null,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission } = usePermission();

  const hasAccess = requireAll
    ? hasPermission(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{noPermissionFallback}</>;
  }

  return <Button {...props} />;
}
