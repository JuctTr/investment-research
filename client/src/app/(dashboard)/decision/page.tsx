'use client';

import { Typography, Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ActionType, DecisionStatus } from '@/types';

const { Title } = Typography;

/**
 * 决策管理列表页
 */
export default function DecisionPage() {
  const statusColorMap: Record<DecisionStatus, string> = {
    PLANNING: 'blue',
    EXECUTED: 'orange',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };

  const statusTextMap: Record<DecisionStatus, string> = {
    PLANNING: '计划中',
    EXECUTED: '已执行',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };

  const actionTextMap: Record<ActionType, string> = {
    BUY: '买入',
    SELL: '卖出',
    HOLD: '持有',
  };

  const columns: ColumnsType<{
    id: string;
    title: string;
    action: ActionType;
    status: DecisionStatus;
    amount: number;
    createdAt: string;
  }> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: ActionType) => actionTextMap[action],
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DecisionStatus) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">编辑</Button>
          <Button type="link" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          决策管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新建决策
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={[]}
        rowKey="id"
        pagination={{
          total: 0,
          pageSize: 10,
        }}
      />
    </div>
  );
}
