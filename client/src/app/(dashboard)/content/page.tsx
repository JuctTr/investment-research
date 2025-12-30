'use client';

import { Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ContentType } from '@/types';

const { Title } = Typography;

/**
 * 内容管理列表页
 */
export default function ContentPage() {
  const columns: ColumnsType<{
    id: string;
    title: string;
    contentType: ContentType;
    createdAt: string;
  }> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
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
          内容管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新建内容
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
