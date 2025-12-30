'use client';

import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

/**
 * 登录页面
 */
export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const handleFinish = async (values: { email: string; password: string }) => {
    try {
      // TODO: 调用登录 API
      console.log('Login values:', values);

      // 模拟登录成功
      message.success('登录成功');

      // 保存 Token
      localStorage.setItem('access_token', 'mock_token');

      // 跳转到仪表盘
      router.push('/dashboard');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>投研分析系统</Title>
        <Text type="secondary">登录以继续</Text>
      </div>

      <Form
        form={form}
        name="login"
        onFinish={handleFinish}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="邮箱"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
