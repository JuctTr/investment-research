'use client'

import { ConfigProvider, type ThemeConfig } from 'antd'
import { type ReactNode } from 'react'

interface AntdProviderProps {
  children: ReactNode
}

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
}

export function AntdProvider({ children }: AntdProviderProps) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>
}