/**
 * 任务详情预览页面
 * 功能：展示任务完整信息，包括统计数据和错误信息
 */
"use client";

import { useTaskList } from "@/features/crawler/hooks/useTaskList";
import type { TaskStatus } from "@/features/crawler/types";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Space, Spin, Tag } from "antd";
import { useRouter } from "next/navigation";

const TASK_STATUS_CONFIG: Record<TaskStatus, { color: string; label: string }> =
  {
    PENDING: { color: "default", label: "待处理" },
    RUNNING: { color: "processing", label: "运行中" },
    SUCCESS: { color: "success", label: "成功" },
    FAILED: { color: "error", label: "失败" },
    CANCELLED: { color: "default", label: "已取消" },
  };

interface PreviewPageProps {
  params: {
    taskId: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const router = useRouter();
  const { taskId } = params;

  // 使用useTaskList获取任务详情（带信息源关联）
  const { tasks, isLoading, error, refetch } = useTaskList({
    pageSize: 100,
  });

  // 查找当前任务
  const task = tasks.find((t) => t.id === taskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="加载任务详情..." />
      </div>
    );
  }

  if (error || !task) {
    return (
      <Alert
        message="加载失败"
        description="无法加载任务详情，请稍后重试"
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => router.back()}>
            返回
          </Button>
        }
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            返回
          </Button>
          <span>任务详情 - {task.id.slice(0, 8)}...</span>
        </Space>
      }
      extra={<Button onClick={() => refetch()}>刷新</Button>}
    >
      {/* 任务基本信息 */}
      <Descriptions bordered column={2} className="mb-4">
        <Descriptions.Item label="任务ID" span={2}>
          {task.id}
        </Descriptions.Item>
        <Descriptions.Item label="信息源ID">{task.sourceId}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={TASK_STATUS_CONFIG[task.status].color}>
            {TASK_STATUS_CONFIG[task.status].label}
          </Tag>
        </Descriptions.Item>

        {/* 信息源信息 */}
        {task.source && (
          <>
            <Descriptions.Item label="信息源名称">
              {task.source.name}
            </Descriptions.Item>
            <Descriptions.Item label="信息源类型">
              {task.source.sourceType}
            </Descriptions.Item>
          </>
        )}

        <Descriptions.Item label="已抓取">
          {task.totalFetched} 篇
        </Descriptions.Item>
        <Descriptions.Item label="已解析">
          {task.totalParsed} 篇
        </Descriptions.Item>
        <Descriptions.Item label="已存储">
          {task.totalStored} 篇
        </Descriptions.Item>

        <Descriptions.Item label="调度时间">
          {task.scheduledAt
            ? new Date(task.scheduledAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {task.startedAt
            ? new Date(task.startedAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="完成时间">
          {task.completedAt
            ? new Date(task.completedAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间" span={2}>
          {new Date(task.createdAt).toLocaleString("zh-CN")}
        </Descriptions.Item>

        {/* 错误信息 */}
        {task.errorMessage && (
          <Descriptions.Item label="错误信息" span={2}>
            <Alert
              message={task.errorMessage}
              description={
                task.errorStack && (
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      fontSize: 12,
                    }}
                  >
                    {task.errorStack}
                  </pre>
                )
              }
              type="error"
              showIcon
            />
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* 状态提示 */}
      {task.status === "RUNNING" && (
        <Alert
          message="任务正在执行中"
          description="任务正在执行，数据会持续更新..."
          type="info"
          showIcon
        />
      )}

      {task.status === "SUCCESS" && task.totalStored === 0 && (
        <Alert
          message="任务已完成但无数据存储"
          description="任务执行成功，但没有存储任何数据，可能信息源没有新内容"
          type="warning"
          showIcon
        />
      )}
    </Card>
  );
}
