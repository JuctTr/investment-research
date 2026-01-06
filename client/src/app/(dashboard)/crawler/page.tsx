/**
 * 任务监控页面
 * 功能：任务列表、智能轮询、状态展示、取消任务、查看详情
 */
"use client";

import { useTaskList } from "@/features/crawler/hooks/useTaskList";
import { useTaskPolling } from "@/features/crawler/hooks/useTaskPolling";
import { useUIStore } from "@/features/crawler/stores/ui.store";
import type { CrawlerTask, TaskStatus } from "@/features/crawler/types";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  EyeOutlined,
  FileTextOutlined,
  LinkOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const { Text, Paragraph } = Typography;

const TASK_STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "全部", value: undefined as any },
  { label: "待处理", value: "PENDING" },
  { label: "运行中", value: "RUNNING" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
  { label: "已取消", value: "CANCELLED" },
];

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { color: string; icon: React.ReactNode; label: string }
> = {
  PENDING: { color: "default", icon: <ClockCircleOutlined />, label: "待处理" },
  RUNNING: { color: "processing", icon: <LoadingOutlined />, label: "运行中" },
  SUCCESS: { color: "success", icon: <CheckCircleOutlined />, label: "成功" },
  FAILED: { color: "error", icon: <CloseCircleOutlined />, label: "失败" },
  CANCELLED: {
    color: "default",
    icon: <CloseCircleOutlined />,
    label: "已取消",
  },
};

const SOURCE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  XUEQIU: { label: "雪球", color: "blue" },
  WECHAT: { label: "微信公众号", color: "green" },
  RSS: { label: "RSS", color: "orange" },
  TWITTER: { label: "Twitter", color: "cyan" },
  REDDIT: { label: "Reddit", color: "red" },
  HACKERNEWS: { label: "Hacker News", color: "purple" },
  CUSTOM: { label: "自定义", color: "default" },
};

export default function TasksPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(
    undefined
  );
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [selectedTask, setSelectedTask] = useState<CrawlerTask | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // 获取任务列表（带信息源关联）
  const { tasks, total, isLoading, isFetching, refetch } = useTaskList({
    page: pagination.current,
    pageSize: pagination.pageSize,
    status: statusFilter,
    withSource: true,
  });

  // 智能轮询
  const { isPolling, startPolling, stopPolling } = useTaskPolling(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      status: statusFilter,
    },
    { enabled: true, interval: 5000 }
  );

  const { openPreviewDrawer } = useUIStore();

  // 有运行中任务时自动开始轮询
  useEffect(() => {
    const hasRunningTasks = tasks.some(
      (t) => t.status === "PENDING" || t.status === "RUNNING"
    );
    if (hasRunningTasks && !isPolling) {
      startPolling();
    } else if (!hasRunningTasks && isPolling) {
      stopPolling();
    }
  }, [tasks, isPolling, startPolling, stopPolling]);

  // 查看任务详情
  const handleViewDetail = (task: CrawlerTask) => {
    setSelectedTask(task);
    setDetailVisible(true);
  };

  // 跳转到信息源详情
  const handleViewSource = (sourceId: string) => {
    router.push(`/crawler/sources?sourceId=${sourceId}`);
  };

  // 表格列定义
  const columns: ColumnsType<CrawlerTask> = [
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text code copyable={{ text: id }}>
            {id.slice(0, 8)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "信息源",
      key: "source",
      width: 200,
      render: (_, record) => {
        if (!record.source) {
          return <Text type="secondary">未加载</Text>;
        }
        const sourceTypeConfig = SOURCE_TYPE_CONFIG[
          record.source.sourceType
        ] || {
          label: record.source.sourceType,
          color: "default",
        };
        return (
          <div>
            <div>
              <Tooltip title={record.source.name}>
                <Text strong ellipsis style={{ maxWidth: 150 }}>
                  {record.source.name}
                </Text>
              </Tooltip>
            </div>
            <Space size={4}>
              <Tag color={sourceTypeConfig.color} style={{ fontSize: 11 }}>
                {sourceTypeConfig.label}
              </Tag>
              <Tooltip title="查看信息源详情">
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => handleViewSource(record.sourceId)}
                  style={{ padding: 0, height: "auto", fontSize: 12 }}
                />
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
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
      title: "处理统计",
      key: "stats",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Badge
            count={record.totalFetched}
            showZero
            overflowCount={9999}
            style={{ backgroundColor: "#1890ff" }}
          >
            <DatabaseOutlined style={{ fontSize: 16, color: "#1890ff" }} />
            <span style={{ marginLeft: 4, fontSize: 12 }}>已抓取</span>
          </Badge>
          <Badge
            count={record.totalParsed}
            showZero
            overflowCount={9999}
            style={{ backgroundColor: "#52c41a" }}
          >
            <FileTextOutlined style={{ fontSize: 16, color: "#52c41a" }} />
            <span style={{ marginLeft: 4, fontSize: 12 }}>已解析</span>
          </Badge>
          <Badge
            count={record.totalStored}
            showZero
            overflowCount={9999}
            style={{ backgroundColor: "#722ed1" }}
          >
            <SaveOutlined style={{ fontSize: 16, color: "#722ed1" }} />
            <span style={{ marginLeft: 4, fontSize: 12 }}>已存储</span>
          </Badge>
        </Space>
      ),
    },
    {
      title: "调度时间",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      width: 160,
      render: (date: Date | null) =>
        date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "开始时间",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 160,
      render: (date: Date | null) =>
        date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "完成时间",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 160,
      render: (date: Date | null) =>
        date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="查看详情">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Tooltip>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    running: tasks.filter((t) => t.status === "RUNNING").length,
    success: tasks.filter((t) => t.status === "SUCCESS").length,
    failed: tasks.filter((t) => t.status === "FAILED").length,
  };

  return (
    <>
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
            <Button
              icon={<ReloadOutlined />}
              loading={isLoading || isFetching}
              onClick={() => refetch()}
            >
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
              <div className="text-2xl font-bold text-gray-500">
                {stats.pending}
              </div>
              <div className="text-gray-500">待处理</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.running}
              </div>
              <div className="text-gray-500">运行中</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.success}
              </div>
              <div className="text-gray-500">成功</div>
            </div>
          </Card>
          <Card size="small">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {stats.failed}
              </div>
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
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        placement="right"
        size={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {selectedTask && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" className="mb-4">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="任务ID" span={2}>
                  <Text code copyable={{ text: selectedTask.id }}>
                    {selectedTask.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={TASK_STATUS_CONFIG[selectedTask.status].color}>
                    {TASK_STATUS_CONFIG[selectedTask.status].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="信息源ID">
                  <Text code copyable={{ text: selectedTask.sourceId }}>
                    {selectedTask.sourceId.slice(0, 8)}...
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="调度时间">
                  {selectedTask.scheduledAt
                    ? new Date(selectedTask.scheduledAt).toLocaleString("zh-CN")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {selectedTask.startedAt
                    ? new Date(selectedTask.startedAt).toLocaleString("zh-CN")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  {selectedTask.completedAt
                    ? new Date(selectedTask.completedAt).toLocaleString("zh-CN")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(selectedTask.createdAt).toLocaleString("zh-CN")}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 信息源信息 */}
            {selectedTask.source && (
              <Card title="信息源" size="small" className="mb-4">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="名称">
                    {selectedTask.source.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="类型">
                    <Tag
                      color={
                        SOURCE_TYPE_CONFIG[selectedTask.source.sourceType]
                          ?.color
                      }
                    >
                      {SOURCE_TYPE_CONFIG[selectedTask.source.sourceType]
                        ?.label || selectedTask.source.sourceType}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="URL">
                    <Tooltip title={selectedTask.source.sourceUrl}>
                      <Text ellipsis style={{ maxWidth: 400 }}>
                        {selectedTask.source.sourceUrl}
                      </Text>
                    </Tooltip>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* 处理统计 */}
            <Card title="处理统计" size="small" className="mb-4">
              <Space size="large">
                <Statistic
                  title="已抓取"
                  value={selectedTask.totalFetched}
                  prefix={<DatabaseOutlined />}
                  suffix="篇"
                />
                <Statistic
                  title="已解析"
                  value={selectedTask.totalParsed}
                  prefix={<FileTextOutlined />}
                  suffix="篇"
                />
                <Statistic
                  title="已存储"
                  value={selectedTask.totalStored}
                  prefix={<SaveOutlined />}
                  suffix="篇"
                />
              </Space>
            </Card>

            {/* 错误信息 */}
            {selectedTask.errorMessage && (
              <Card title="错误信息" size="small">
                <Alert
                  type="error"
                  message={selectedTask.errorMessage}
                  description={
                    selectedTask.errorStack && (
                      <Paragraph>
                        <Text
                          code
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontSize: 12,
                          }}
                        >
                          {selectedTask.errorStack}
                        </Text>
                      </Paragraph>
                    )
                  }
                  showIcon
                />
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
