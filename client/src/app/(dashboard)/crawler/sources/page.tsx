/**
 * 信息源管理页面
 * 功能：列表展示、创建、编辑、删除、启动/停止爬取
 */
"use client";

import { useSourceList } from "@/features/crawler/hooks/useSourceList";
import { useUIStore } from "@/features/crawler/stores/ui.store";
import type { CrawlerSource, SourceType } from "@/features/crawler/types";
import {
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

const SOURCE_TYPE_OPTIONS: { label: string; value: SourceType }[] = [
  { label: "雪球用户", value: "CUSTOM" },
  { label: "雪球动态", value: "XUEQIU_STATUS" },
  { label: "微信公众号", value: "WECHAT" },
  { label: "RSS订阅", value: "RSS" },
];

const SOURCE_TYPE_COLORS: Record<SourceType, string> = {
  XUEQIU_USER: "blue",
  XUEQIU_STATUS: "cyan",
  WECHAT: "green",
  RSS: "orange",
};

export default function SourcesPage() {
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const {
    sources,
    total,
    isLoading,
    isFetching,
    refetch,
    createSource,
    updateSource,
    deleteSource,
    batchDeleteSources,
    startSource,
    stopSource,
    isCreating,
    isUpdating,
    isDeleting,
    isStarting,
    isStopping,
  } = useSourceList({
    page: pagination.current,
    pageSize: pagination.pageSize,
  });

  const {
    sourceModalVisible,
    editingSource,
    selectedSourceIds,
    openSourceModal,
    closeSourceModal,
    setSelectedSources,
  } = useUIStore();

  // 打开创建/编辑模态框
  const handleOpenModal = (source?: CrawlerSource) => {
    openSourceModal(source);
    if (source) {
      form.setFieldsValue(source);
    } else {
      form.resetFields();
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    closeSourceModal();
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 将 fetchInterval 转换为数字
      const dto = {
        ...values,
        fetchInterval: values.fetchInterval
          ? Number(values.fetchInterval)
          : undefined,
      };
      if (editingSource) {
        updateSource({ id: editingSource.id, dto });
      } else {
        createSource(dto);
      }
      handleCloseModal();
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 删除单个信息源
  const handleDelete = (id: string) => {
    deleteSource(id);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedSourceIds.length === 0) {
      message.warning("请至少选择一个信息源");
      return;
    }
    batchDeleteSources(selectedSourceIds);
    setSelectedSources([]);
  };

  // 启动/停止爬取
  const handleToggleCrawl = (source: CrawlerSource) => {
    if (source.enabled) {
      stopSource(source.id);
    } else {
      startSource(source.id);
    }
  };

  // 格式化爬取频率显示
  const formatFetchInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}小时`;
    return `${(seconds / 86400).toFixed(1)}天`;
  };

  // 表格列定义
  const columns: ColumnsType<CrawlerSource> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "类型",
      dataIndex: "sourceType",
      key: "sourceType",
      width: 100,
      render: (type: SourceType) => (
        <Tag color={SOURCE_TYPE_COLORS[type]}>
          {SOURCE_TYPE_OPTIONS.find((t) => t.value === type)?.label}
        </Tag>
      ),
    },
    {
      title: "URL",
      dataIndex: "sourceUrl",
      key: "sourceUrl",
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span className="text-gray-600">{url}</span>
        </Tooltip>
      ),
    },
    {
      title: "爬取频率",
      dataIndex: "fetchInterval",
      key: "fetchInterval",
      width: 100,
      render: (interval: number) => (
        <Tooltip title={`${interval}秒`}>
          <span>{formatFetchInterval(interval)}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "success" : "default"}>
          {enabled ? "已启用" : "已禁用"}
        </Tag>
      ),
    },
    {
      title: "最后抓取",
      dataIndex: "lastFetchAt",
      key: "lastFetchAt",
      width: 180,
      render: (date: Date | null) =>
        date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.enabled ? "停止爬取" : "启动爬取"}>
            <Button
              type="text"
              icon={
                record.enabled ? (
                  <PauseCircleOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              loading={record.enabled ? isStopping : isStarting}
              onClick={() => handleToggleCrawl(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个信息源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="信息源管理"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => refetch()}
          >
            刷新
          </Button>
          {selectedSourceIds.length > 0 && (
            <Popconfirm
              title="确认批量删除"
              description={`确定要删除选中的 ${selectedSourceIds.length} 个信息源吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            添加信息源
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={sources}
        loading={isLoading || isFetching}
        scroll={{ x: 1300 }}
        rowSelection={{
          selectedRowKeys: selectedSourceIds,
          onChange: (keys) => setSelectedSources(keys as string[]),
        }}
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

      <Modal
        title={editingSource ? "编辑信息源" : "添加信息源"}
        open={sourceModalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={isCreating || isUpdating}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入信息源名称" }]}
          >
            <Input placeholder="请输入信息源名称" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="sourceType"
            rules={[{ required: true, message: "请选择信息源类型" }]}
          >
            <Select
              options={SOURCE_TYPE_OPTIONS}
              placeholder="请选择信息源类型"
            />
          </Form.Item>

          <Form.Item
            label="URL"
            name="sourceUrl"
            rules={[
              { required: true, message: "请输入URL" },
              { type: "url", message: "请输入有效的URL" },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            label="爬取频率（秒）"
            name="fetchInterval"
            initialValue={3600}
            rules={[{ required: true, message: "请输入爬取频率" }]}
            tooltip="系统将根据此频率自动抓取信息源"
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                type="number"
                min={60}
                step={60}
                placeholder="默认3600秒（1小时）"
                style={{ flex: 1 }}
              />
              <Select
                defaultValue="3600"
                onChange={(value) =>
                  form.setFieldValue("fetchInterval", value)
                }
                style={{ width: 120 }}
                options={[
                  { label: "5分钟", value: 300 },
                  { label: "15分钟", value: 900 },
                  { label: "30分钟", value: 1800 },
                  { label: "1小时", value: 3600 },
                  { label: "6小时", value: 21600 },
                  { label: "24小时", value: 86400 },
                ]}
              />
            </Space.Compact>
          </Form.Item>

          <Form.Item label="配置" name="config">
            <Input.TextArea
              rows={4}
              placeholder='JSON格式的配置，例如: {"interval": 60}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
