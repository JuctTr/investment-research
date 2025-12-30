"use client";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 首页 - 路由跳转页面
 *
 * 根据用户登录状态进行跳转：
 * - 已登录：跳转到仪表盘 /dashboard
 * - 未登录：跳转到登录页 /login
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 检查是否有 Token
    const token = localStorage.getItem("access_token");

    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}
