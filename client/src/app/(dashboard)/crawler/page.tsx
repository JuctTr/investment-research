/**
 * 任务监控页面
 * 功能：任务列表、智能轮询、状态展示、取消任务
 */
'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Progress,
  Tooltip,
  Drawer,
  Descriptions,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTaskPolling } from '@/features/crawler/hooks/useTaskPolling';
import { useUIStore } from '@/features/crawler/stores/ui.store';
import type { CrawlerTask, TaskStatus } from '@/features/crawler/types';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';

const TASK_STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: '全部', value: undefined as any },
  { label: '待处理', value: 'PENDING' },
  { label: '运行中', value: 'RUNNING' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '已取消', value: 'CANCELLED' },
];

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; icon: React.ReactNode; label: string }
> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined />, label: '待处理' },
  RUNNING: { color: 'processing', icon: <LoadingOutlined />, label: '运行中' },
  SUCCESS: { color: 'success', icon: <CheckCircleOutlined />, label: '成功' },
  FAILED: { color: 'error', icon: <CloseCircleOutlined />, label: '失败' },
  CANCELLED: { color: 'default', icon: <CloseCircleOutlined />, label: '已取消' },
};

export default function TasksPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  const {
    tasks,
    total,
    isLoading,
    isPolling,
    refetch,
    cancelTask,
    isCancelling,
    startPolling,
    stopPolling,
  } = useTaskPolling(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      status: statusFilter,
    },
    { enabled: true, interval: 5000 },
  );

  const { openPreviewDrawer } = useUIStore();

  // 查看任务详情
  const handleViewDetail = (task: CrawlerTask) => {
    openPreviewDrawer(task.id);
  };

  // 取消任务
  const handleCancelTask = (taskId: string) => {
    cancelTask(taskId);
  };

  // 表格列定义
  const columns: ColumnsType<CrawlerTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <span className="text-gray-600">{id.slice(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '信息源ID',
      dataIndex: 'sourceId',
      key: 'sourceId',
      width: 120,
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <span className="text-gray-600">{id.slice(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const config = TASK_STATUS_CONFIG[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record) => (
        <Tooltip title={`${progress}%`}>
          <Progress
            percent={progress}
            size="small"
            status={
              record.status === 'SUCCESS'
                ? 'success'
                : record.status === 'FAILED'
                  ? 'exception'
                  : 'active'
            }
          />
        </Tooltip>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (date: Date | null) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 180,
      render: (date: Date | null) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {(record.status === 'PENDING' || record.status === 'RUNNING') && (
            <Tooltip title="取消任务">
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                loading={isCancelling}
                onClick={() => handleCancelTask(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    running: tasks.filter((t) => t.status === 'RUNNING').length,
    success: tasks.filter((t) => t.status === 'SUCCESS').length,
    failed: tasks.filter((t) => t.status === 'FAILED').length,
  };

  return (
    <Card
      title={
        <Space>
          <span>任务监控</span>
          {isPolling && (
            <Tag color="processing" icon={<LoadingOutlined />}>
              轮询中
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Select
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={TASK_STATUS_OPTIONS}
            placeholder="筛选状态"
          />
          {isPolling ? (
            <Button icon={<CloseCircleOutlined />} onClick={stopPolling}>
              停止轮询
            </Button>
          ) : (
            <Button icon={<ReloadOutlined />} onClick={startPolling}>
              开始轮询
            </Button>
          )}
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => refetch()}>
            刷新
          </Button>
        </Space>
      }
    >
      {/* 统计信息 */}
      <div className="mb-4 grid grid-cols-5 gap-4">
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500">总任务</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
            <div className="text-gray-500">待处理</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
            <div className="text-gray-500">运行中</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
            <div className="text-gray-500">成功</div>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-gray-500">失败</div>
          </div>
        </Card>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={isLoading}
        scroll={{ x: 1400 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
      />
    </Card>
  );
}
