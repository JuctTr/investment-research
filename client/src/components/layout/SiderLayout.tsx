"use client";

import {
  BulbOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FundOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import type { FC, ReactNode } from "react";
import { useMemo, useState } from "react";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

interface MenuGroup extends MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: MenuItem[];
}

/**
 * 侧边菜单栏组件
 *
 * 功能：
 * - 显示导航菜单
 * - 当前路由高亮
 * - 支持菜单展开/收起
 * - 深色主题
 */
export const SiderLayout: FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  // 控制菜单组的展开/收起状态
  const [openKeys, setOpenKeys] = useState<string[]>(["/content-group"]);

  // 菜单配置
  const menuItems: MenuGroup[] = [
    // 独立选项区（不可折叠）
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "仪表盘",
    },
    // 分组导航（可折叠）
    {
      key: "/crawler-group",
      icon: <CloudServerOutlined />,
      label: "爬虫管理",
      children: [
        {
          key: "/crawler/sources",
          label: "信息源管理",
        },
        {
          key: "/crawler",
          label: "任务监控",
        },
      ],
    },
    {
      key: "/content-group",
      icon: <FileTextOutlined />,
      label: "内容管理",
      children: [
        {
          key: "/content",
          label: "内容列表",
        },
        {
          key: "/content/categories",
          label: "分类管理",
        },
      ],
    },
    {
      key: "/viewpoint-group",
      icon: <BulbOutlined />,
      label: "观点管理",
      children: [
        {
          key: "/viewpoint",
          label: "观点列表",
        },
      ],
    },
    {
      key: "/decision-group",
      icon: <FundOutlined />,
      label: "决策管理",
      children: [
        {
          key: "/decision",
          label: "决策列表",
        },
      ],
    },
    {
      key: "/review-group",
      icon: <HistoryOutlined />,
      label: "复盘管理",
      children: [
        {
          key: "/review",
          label: "复盘列表",
        },
      ],
    },
  ];

  // 获取当前选中的菜单
  const selectedKeys = useMemo(() => {
    return [pathname];
  }, [pathname]);

  // 处理菜单点击
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    // 只对叶子节点（非分组）进行路由跳转
    const isGroup = menuItems.some((item) => item.key === key);
    if (!isGroup) {
      router.push(key as string);
    }
  };

  // 处理子菜单展开/收起
  const handleOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      width={240}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#121826",
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 18,
          fontWeight: 600,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        投研系统
      </div>

      {/* 菜单区域 */}
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        items={menuItems}
        onClick={handleMenuClick}
        onOpenChange={handleOpenChange}
        style={{
          backgroundColor: "#121826",
          borderRight: "none",
        }}
      />
    </Sider>
  );
};
