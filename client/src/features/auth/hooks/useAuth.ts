'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { authService } from '../services/auth.service';
import { useUserStore } from '@/stores/useUserStore';

/**
 * 鉴权 Hook
 *
 * 提供登录、登出、获取用户信息等鉴权功能
 */
export function useAuth() {
  const router = useRouter();
  const { login: storeLogin, logout: storeLogout, isAuthenticated } = useUserStore();

  /**
   * 用户登录
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authService.login({ email, password });

        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;

          // 保存 Token
          authService.saveTokens(accessToken, refreshToken);

          // 更新 Store
          storeLogin(user);

          message.success('登录成功');

          // 跳转到仪表盘
          router.push('/dashboard');

          return true;
        }

        message.error(response.message || '登录失败');
        return false;
      } catch (error) {
        message.error('登录失败，请检查网络连接');
        console.error('Login error:', error);
        return false;
      }
    },
    [router, storeLogin]
  );

  /**
   * 用户登出
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除 Token
      authService.clearTokens();

      // 清除 Store
      storeLogout();

      message.success('已退出登录');

      // 跳转到登录页
      router.push('/login');
    }
  }, [router, storeLogout]);

  /**
   * 检查是否已登录
   */
  const checkAuth = useCallback(() => {
    return isAuthenticated || authService.getAccessToken() !== null;
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
}
