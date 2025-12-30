import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

/**
 * 认证路由组布局
 *
 * 用于登录、注册等不需要主布局的页面
 * URL 中不包含 (auth) 段
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 40,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
