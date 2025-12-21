'use client'

import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services'
import type { Content } from '@/types'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

export default function ContentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 获取内容列表
  const { data: contentsData, isLoading } = useQuery({
    queryKey: ['contents'],
    queryFn: () => contentService.getContents({}),
  })

  // 创建内容
  const createMutation = useMutation({
    mutationFn: (data: {
      title: string
      description?: string
      contentType: string
      tags: string[]
    }) => contentService.createContent(data),
    onSuccess: () => {
      message.success('内容创建成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
    onError: () => {
      message.error('内容创建失败')
    },
  })

  // 更新内容
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contentService.updateContent(id, data),
    onSuccess: () => {
      message.success('内容更新成功')
      setIsModalOpen(false)
      setEditingContent(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
    onError: () => {
      message.error('内容更新失败')
    },
  })

  // 删除内容
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentService.deleteContent(id),
    onSuccess: () => {
      message.success('内容删除成功')
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
    onError: () => {
      message.error('内容删除失败')
    },
  })

  const handleCreate = () => {
    setEditingContent(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (record: Content) => {
    setEditingContent(record)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      contentType: record.contentType,
      tags: record.tags,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = (values: any) => {
    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          ARTICLE: { color: 'blue', text: '文章' },
          NEWS: { color: 'green', text: '新闻' },
          REPORT: { color: 'orange', text: '研报' },
          BOOK: { color: 'purple', text: '书籍' },
          VIDEO: { color: 'red', text: '视频' },
          PODCAST: { color: 'cyan', text: '播客' },
          NOTE: { color: 'default', text: '笔记' },
        }
        const config = typeMap[type as keyof typeof typeMap] || typeMap.ARTICLE
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Content) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个内容吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>内容管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增内容
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={contentsData?.data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: contentsData?.data?.page,
            pageSize: contentsData?.data?.limit,
            total: contentsData?.data?.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingContent ? '编辑内容' : '新增内容'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingContent(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            contentType: 'ARTICLE',
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            name="contentType"
            label="内容类型"
            rules={[{ required: true, message: '请选择内容类型' }]}
          >
            <Select placeholder="请选择内容类型">
              <Select.Option value="ARTICLE">文章</Select.Option>
              <Select.Option value="NEWS">新闻</Select.Option>
              <Select.Option value="REPORT">研报</Select.Option>
              <Select.Option value="BOOK">书籍</Select.Option>
              <Select.Option value="VIDEO">视频</Select.Option>
              <Select.Option value="PODCAST">播客</Select.Option>
              <Select.Option value="NOTE">笔记</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingContent ? '更新' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingContent(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}