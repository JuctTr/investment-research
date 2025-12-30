import type { User } from '@/types';

/**
 * 登录请求
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * 登录响应
 */
export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken?: string;
};

/**
 * 刷新 Token 请求
 */
export type RefreshTokenRequest = {
  refreshToken: string;
};

/**
 * 刷新 Token 响应
 */
export type RefreshTokenResponse = {
  accessToken: string;
};

/**
 * 权限标识
 */
export type Permission =
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  | 'viewpoint:read'
  | 'viewpoint:write'
  | 'viewpoint:delete'
  | 'decision:read'
  | 'decision:write'
  | 'decision:execute'
  | 'decision:delete'
  | 'review:read'
  | 'review:write'
  | 'review:delete';

/**
 * 用户角色
 */
export type Role = 'admin' | 'user' | 'viewer';

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'content:read',
    'content:write',
    'content:delete',
    'viewpoint:read',
    'viewpoint:write',
    'viewpoint:delete',
    'decision:read',
    'decision:write',
    'decision:execute',
    'decision:delete',
    'review:read',
    'review:write',
    'review:delete',
  ],
  user: [
    'content:read',
    'content:write',
    'content:delete',
    'viewpoint:read',
    'viewpoint:write',
    'viewpoint:delete',
    'decision:read',
    'decision:write',
    'decision:execute',
    'decision:delete',
    'review:read',
    'review:write',
    'review:delete',
  ],
  viewer: [
    'content:read',
    'viewpoint:read',
    'decision:read',
    'review:read',
  ],
};
