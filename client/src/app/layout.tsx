import { AntdProvider } from "@/components/providers/AntdProvider";
import { QueryProvider } from "@/components/providers/QueryClientProvider";
import { App } from "antd";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { MSWProvider } from "@/components/providers/MSWProvider"; // 已禁用，使用真实后端 API

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "投研分析系统",
  description: "个人投研分析系统 - 观点 → 决策 → 复盘",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <App>
            {/* <MSWProvider> */} {/* 已禁用，使用真实后端 API */}
            <AntdProvider>{children}</AntdProvider>
            {/* </MSWProvider> */}
          </App>
        </QueryProvider>
      </body>
    </html>
  );
}
