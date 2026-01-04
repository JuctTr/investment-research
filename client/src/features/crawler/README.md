# 爬虫模块前端实现说明

## 已实现的功能

### 第1步：类型定义和Mock数据 ✅
- `types/` - 完整的TypeScript类型定义
- `mocks/` - MSW Mock数据和处理器

### 第2步：API服务层和状态管理 ✅
- `services/api.ts` - Axios配置（请求/响应拦截器）
- `services/crawler.service.ts` - 爬虫API服务类
- `stores/ui.store.ts` - Zustand UI状态管理

### 第3步：自定义Hooks ✅
- `hooks/useSourceList.ts` - 信息源列表Hook（React Query）
- `hooks/useTaskPolling.ts` - 任务轮询Hook（智能轮询）

### 第4步：页面组件 ✅
- `app/(dashboard)/crawler/sources/page.tsx` - 信息源管理页面
- `app/(dashboard)/crawler/page.tsx` - 任务监控页面
- `app/(dashboard)/crawler/preview/[taskId]/page.tsx` - 数据预览页面

### 第5步：入口配置 ✅
- MSW已配置（`mocks/browser.ts`自动启动）
- React Query和Ant Design Provider已配置

## 技术栈

- **React 18** - 函数组件 + Hooks
- **Next.js 16** - App Router
- **TypeScript** - 严格类型检查
- **Ant Design 6** - UI组件库
- **React Query** - 服务端状态管理
- **Zustand** - 客户端状态管理
- **Axios** - HTTP客户端
- **MSW** - Mock Service Worker（开发环境）

## 核心功能说明

### 1. 信息源管理（/crawler/sources）

**功能**：
- ✅ 列表展示（分页、筛选）
- ✅ 创建信息源（Modal表单）
- ✅ 编辑信息源
- ✅ 删除信息源（单个/批量）
- ✅ 启动/停止爬取
- ✅ 状态展示

**使用的Hook**：
- `useSourceList()` - 信息源列表和CRUD操作
- `useUIStore()` - UI状态管理（Modal、选中项）

### 2. 任务监控（/crawler）

**功能**：
- ✅ 任务列表（分页、状态筛选）
- ✅ 智能轮询（页面可见时5秒轮询，隐藏时暂停）
- ✅ 任务状态展示（进度条、统计卡片）
- ✅ 取消任务
- ✅ 查看详情（跳转到预览页面）

**使用的Hook**：
- `useTaskPolling()` - 任务列表和轮询控制
- Page Visibility API - 检测页面可见性

**智能轮询逻辑**：
```typescript
// 页面可见且有运行中任务时自动轮询
useEffect(() => {
  const hasRunningTasks = tasks.some(t => t.status === 'RUNNING');
  if (hasRunningTasks && !document.hidden) {
    setIsPolling(true);
  }
}, [tasks]);
```

### 3. 数据预览（/crawler/preview/[taskId]）

**功能**：
- ✅ 任务详情展示
- ✅ JSON格式化展示
- ✅ 复制JSON到剪贴板
- ✅ 下载JSON文件
- ✅ 错误信息展示

## 状态管理架构

### 服务端状态（React Query）
```typescript
// 信息源列表
const { sources, isLoading, createSource, deleteSource } = useSourceList();

// 任务列表（带轮询）
const { tasks, isPolling, refetch, cancelTask } = useTaskPolling();
```

### 客户端状态（Zustand）
```typescript
// UI状态（Modal、选中项等）
const { sourceModalVisible, openSourceModal, closeSourceModal } = useUIStore();
```

## API端点（Mock数据）

### 信息源管理
- `GET /api/v1/crawler/sources` - 获取列表
- `POST /api/v1/crawler/sources` - 创建
- `PATCH /api/v1/crawler/sources/:id` - 更新
- `DELETE /api/v1/crawler/sources/:id` - 删除
- `POST /api/v1/crawler/sources/:id/start` - 启动
- `POST /api/v1/crawler/sources/:id/stop` - 停止

### 任务管理
- `GET /api/v1/crawler/tasks` - 获取列表
- `GET /api/v1/crawler/tasks/:id` - 获取详情
- `POST /api/v1/crawler/tasks` - 创建任务
- `POST /api/v1/crawler/tasks/:id/cancel` - 取消任务

## 开发指南

### 运行项目

```bash
# 启动前端开发服务器
cd client
pnpm dev

# 访问地址
http://localhost:3000
```

### Mock数据

MSW在开发环境自动启动，无需额外配置。Mock数据位于：
- `mocks/factories.ts` - 数据工厂函数
- `mocks/handlers.ts` - API请求处理器
- `public/mockServiceWorker.js` - Service Worker文件

### 添加新的API端点

1. 在 `services/crawler.service.ts` 添加API方法
2. 在 `mocks/handlers.ts` 添加Mock处理器
3. 在Hook中调用新的API方法

### 添加新的页面

1. 在 `app/(dashboard)/crawler/` 创建页面文件
2. 使用 `useSourceList` 或 `useTaskPolling` Hook
3. 使用 Ant Design 组件构建UI

## 类型定义

所有类型定义都在 `types/` 目录：
- `source.types.ts` - 信息源相关类型
- `task.types.ts` - 任务相关类型
- `index.ts` - 统一导出

## 注意事项

1. **TypeScript严格模式**：所有代码必须有类型定义，禁止使用`any`
2. **错误处理**：统一使用Ant Design的message组件展示错误
3. **Loading状态**：所有异步操作都要显示loading状态
4. **轮询优化**：使用Page Visibility API避免页面不可见时浪费资源
5. **Mock数据**：仅在开发环境使用MSW，生产环境会自动禁用

## 后续优化建议

1. **单元测试**：使用Jest + React Testing Library
2. **E2E测试**：使用Playwright
3. **性能优化**：
   - 虚拟滚动（长列表）
   - 懒加载（动态导入）
   - React.memo（组件优化）
4. **功能增强**：
   - 实时WebSocket推送（替代轮询）
   - 批量操作（批量启动/停止）
   - 导出功能（Excel/CSV）
   - 高级筛选（日期范围、关键词搜索）

## 文件结构

```
client/src/features/crawler/
├── types/                      # 类型定义
│   ├── index.ts
│   ├── source.types.ts
│   └── task.types.ts
├── services/                   # API服务层
│   ├── api.ts                  # Axios配置
│   └── crawler.service.ts      # 爬虫API服务
├── stores/                     # 状态管理
│   └── ui.store.ts             # UI状态（Zustand）
├── hooks/                      # 自定义Hooks
│   ├── useSourceList.ts        # 信息源列表
│   └── useTaskPolling.ts       # 任务轮询
├── mocks/                      # Mock数据（MSW）
│   ├── browser.ts              # 浏览器配置
│   ├── factories.ts            # 数据工厂
│   └── handlers.ts             # 请求处理器
├── index.ts                    # 统一导出
└── README.md                   # 本文档

client/src/app/(dashboard)/crawler/
├── page.tsx                    # 任务监控页面
├── sources/
│   └── page.tsx                # 信息源管理页面
└── preview/
    └── [taskId]/
        └── page.tsx            # 数据预览页面
```

## 快速开始

```typescript
// 1. 在任何页面中使用信息源列表Hook
import { useSourceList } from '@/features/crawler';

function MyComponent() {
  const { sources, isLoading, createSource } = useSourceList();

  return <div>{/* 你的UI */}</div>;
}

// 2. 使用任务轮询Hook
import { useTaskPolling } from '@/features/crawler';

function TaskMonitor() {
  const { tasks, isPolling, refetch } = useTaskPolling();

  return <div>{/* 你的UI */}</div>;
}

// 3. 使用UI状态管理
import { useUIStore } from '@/features/crawler';

function MyComponent() {
  const { sourceModalVisible, openSourceModal } = useUIStore();

  return (
    <Button onClick={() => openSourceModal()}>打开Modal</Button>
  );
}
```
