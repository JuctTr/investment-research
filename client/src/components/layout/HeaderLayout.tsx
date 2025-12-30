'use client';

import { Layout, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

/**
 * 顶部导航栏组件
 *
 * 功能：
 * - 显示 Logo 和标题
 * - 显示用户信息和下拉菜单
 * - 通知图标（预留）
 */
export function HeaderLayout() {
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      // 处理登出逻辑
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (key === 'profile') {
      // 跳转个人中心
      console.log('Profile');
    } else if (key === 'settings') {
      // 跳转设置页
      console.log('Settings');
    }
  };

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Space>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#262626',
          }}
        >
          投研分析系统
        </div>
      </Space>

      <Space>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>用户</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
