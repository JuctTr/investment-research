'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

/**
 * 403 无权限页面
 */
export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问此页面。"
      extra={
        <Button type="primary" onClick={() => router.push('/dashboard')}>
          返回首页
        </Button>
      }
    />
  );
}
