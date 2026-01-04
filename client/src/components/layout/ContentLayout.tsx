"use client";

import { Breadcrumb } from "antd";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

type ContentLayoutProps = {
  children: ReactNode;
};

type BreadcrumbItem = {
  title: string;
  href?: string;
};

/**
 * 内容区域布局组件
 *
 * 功能：
 * - 显示面包屑导航
 * - 包含页面内容
 */
export function ContentLayout({ children }: ContentLayoutProps) {
  const pathname = usePathname();

  // 路径映射到面包屑
  const breadcrumbMap: Record<string, string> = {
    "/crawler": "爬虫中心",
    "/dashboard": "仪表盘",
    "/content": "内容列表",
    "/viewpoint": "观点列表",
    "/decision": "决策列表",
    "/review": "复盘列表",
  };

  const breadcrumbItems = useMemo(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [
      {
        title: "首页",
        href: "/dashboard",
      },
    ];

    pathSegments.forEach((segment, index) => {
      const path = "/" + pathSegments.slice(0, index + 1).join("/");
      const title = breadcrumbMap[path] || segment;

      items.push({
        title,
        href: index === pathSegments.length - 1 ? undefined : path,
      } as BreadcrumbItem);
    });

    return items;
  }, [pathname, breadcrumbMap]);

  return (
    <div
      style={{
        padding: 24,
        minHeight: "calc(100vh - 64px)",
        background: "#f5f5f5",
      }}
    >
      <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
      <div
        style={{
          padding: 24,
          background: "#fff",
          borderRadius: 2,
          minHeight: 400,
        }}
      >
        {children}
      </div>
    </div>
  );
}
