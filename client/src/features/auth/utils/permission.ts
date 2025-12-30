import type { Permission, Role } from '../types/auth.types';
import { ROLE_PERMISSIONS } from '../types/auth.types';

/**
 * 权限工具函数
 */

/**
 * 检查角色是否拥有指定权限
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * 检查角色是否拥有所有指定权限
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

/**
 * 检查角色是否拥有任意一个指定权限
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/**
 * 获取角色的所有权限
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
