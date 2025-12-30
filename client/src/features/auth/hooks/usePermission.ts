'use client';

import { useMemo, useCallback } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import type { Permission, Role } from '../types/auth.types';
import { ROLE_PERMISSIONS } from '../types/auth.types';

/**
 * 权限 Hook
 *
 * 提供权限检查功能
 */
export function usePermission() {
  const { user } = useUserStore();

  /**
   * 获取用户角色
   */
  const userRole: Role = useMemo(() => {
    return (user?.role as Role) || 'viewer';
  }, [user?.role]);

  /**
   * 获取用户权限列表
   */
  const userPermissions: Permission[] = useMemo(() => {
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  /**
   * 检查是否拥有指定权限
   */
  const hasPermission = useCallback(
    (permission: Permission | Permission[]): boolean => {
      if (Array.isArray(permission)) {
        return permission.every((p) => userPermissions.includes(p));
      }
      return userPermissions.includes(permission);
    },
    [userPermissions]
  );

  /**
   * 检查是否拥有指定权限中的任意一个
   */
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => userPermissions.includes(p));
    },
    [userPermissions]
  );

  /**
   * 检查是否拥有指定角色
   */
  const hasRole = useCallback(
    (role: Role | Role[]): boolean => {
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
    },
    [userRole]
  );

  return {
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
