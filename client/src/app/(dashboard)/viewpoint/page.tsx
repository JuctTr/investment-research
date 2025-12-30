'use client';

import { Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { OutlookType } from '@/types';

const { Title } = Typography;

/**
 * 观点管理列表页
 */
export default function ViewpointPage() {
  const columns: ColumnsType<{
    id: string;
    title: string;
    outlook: OutlookType;
    confidence: number;
    createdAt: string;
  }> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '市场展望',
      dataIndex: 'outlook',
      key: 'outlook',
      render: (outlook: OutlookType) => {
        const map = {
          BULLISH: '看涨',
          BEARISH: '看跌',
          NEUTRAL: '中性',
        };
        return map[outlook];
      },
    },
    {
      title: '信心程度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: number) => `${value}/10`,
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
          观点管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新建观点
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
