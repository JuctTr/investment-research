'use client';

import { Typography, Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ReviewResult } from '@/types';

const { Title } = Typography;

/**
 * 复盘管理列表页
 */
export default function ReviewPage() {
  const resultColorMap: Record<ReviewResult, string> = {
    PROFIT: 'green',
    LOSS: 'red',
    NEUTRAL: 'default',
    PENDING: 'blue',
  };

  const resultTextMap: Record<ReviewResult, string> = {
    PROFIT: '盈利',
    LOSS: '亏损',
    NEUTRAL: '持平',
    PENDING: '待定',
  };

  const columns: ColumnsType<{
    id: string;
    title: string;
    result: ReviewResult;
    profitRate?: number;
    createdAt: string;
  }> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: ReviewResult) => (
        <Tag color={resultColorMap[result]}>{resultTextMap[result]}</Tag>
      ),
    },
    {
      title: '收益率',
      dataIndex: 'profitRate',
      key: 'profitRate',
      render: (value?: number) =>
        value !== undefined ? `${(value * 100).toFixed(2)}%` : '-',
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
          复盘管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新建复盘
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
