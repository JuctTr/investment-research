/**
 * 数据预览页面 - JSON展示
 * 功能：展示爬取结果的JSON数据
 */
'use client';

import React from 'react';
import { Card, Descriptions, Tag, Alert, Spin, Button, Space } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTaskPolling } from '@/features/crawler/hooks/useTaskPolling';
import type { TaskStatus } from '@/features/crawler/types';

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; label: string }
> = {
  PENDING: { color: 'default', label: '待处理' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUCCESS: { color: 'success', label: '成功' },
  FAILED: { color: 'error', label: '失败' },
  CANCELLED: { color: 'default', label: '已取消' },
};

interface PreviewPageProps {
  params: {
    taskId: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const router = useRouter();
  const { taskId } = params;

  // 使用useTaskPolling的useTaskDetail方法
  const { data: taskDetail, isLoading, error } = useTaskPolling().useTaskDetail(taskId);

  // 复制JSON到剪贴板
  const handleCopyJSON = () => {
    if (taskDetail?.data?.result) {
      navigator.clipboard.writeText(JSON.stringify(taskDetail.data.result, null, 2));
    }
  };

  // 下载JSON文件
  const handleDownloadJSON = () => {
    if (taskDetail?.data?.result) {
      const blob = new Blob([JSON.stringify(taskDetail.data.result, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-${taskId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="加载任务详情..." />
      </div>
    );
  }

  if (error || !taskDetail?.data) {
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

  const task = taskDetail.data;

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
      extra={
        <Space>
          {task.result && (
            <>
              <Button icon={<CopyOutlined />} onClick={handleCopyJSON}>
                复制JSON
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadJSON}>
                下载JSON
              </Button>
            </>
          )}
        </Space>
      }
    >
      {/* 任务基本信息 */}
      <Descriptions bordered column={2} className="mb-4">
        <Descriptions.Item label="任务ID">{task.id}</Descriptions.Item>
        <Descriptions.Item label="信息源ID">{task.sourceId}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={TASK_STATUS_CONFIG[task.status].color}>
            {TASK_STATUS_CONFIG[task.status].label}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="进度">{task.progress}%</Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {task.startedAt ? new Date(task.startedAt).toLocaleString('zh-CN') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="完成时间">
          {task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间" span={2}>
          {new Date(task.createdAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
        {task.error && (
          <Descriptions.Item label="错误信息" span={2}>
            <Alert message={task.error} type="error" showIcon />
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* 任务结果JSON */}
      {task.result ? (
        <Card title="爬取结果" size="small">
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[600px] text-sm">
            {JSON.stringify(task.result, null, 2)}
          </pre>
        </Card>
      ) : (
        <Alert
          message="暂无结果"
          description={
            task.status === 'RUNNING' ? '任务正在执行中，请稍后查看...' : '此任务没有返回结果'
          }
          type={task.status === 'RUNNING' ? 'info' : 'warning'}
          showIcon
        />
      )}
    </Card>
  );
}
