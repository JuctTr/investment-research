/**
 * MSW 请求处理器
 * 拦截API请求并返回Mock数据
 */
import { http, HttpResponse } from 'msw';
import { createMockSource, createMockSources, createMockTask, createMockTasks } from './factories';
import type {
  CrawlerSource,
  CrawlerTask,
  CreateSourceDto,
  UpdateSourceDto,
  CreateTaskDto,
  GetSourcesParams,
  GetTasksParams,
} from '../types';

// 模拟数据库
let mockSources: CrawlerSource[] = createMockSources(50);
let mockTasks: CrawlerTask[] = createMockTasks(200);

/**
 * 分页辅助函数
 */
function paginate<T>(data: T[], page: number = 1, pageSize: number = 20) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total: data.length,
  };
}

/**
 * 筛选辅助函数
 */
function filterSources(sources: CrawlerSource[], params: GetSourcesParams) {
  let filtered = [...sources];

  if (params.type) {
    filtered = filtered.filter((s) => s.type === params.type);
  }

  if (params.enabled !== undefined) {
    filtered = filtered.filter((s) => s.enabled === params.enabled);
  }

  return filtered;
}

/**
 * 筛选任务辅助函数
 */
function filterTasks(tasks: CrawlerTask[], params: GetTasksParams) {
  let filtered = [...tasks];

  if (params.status) {
    filtered = filtered.filter((t) => t.status === params.status);
  }

  if (params.sourceId) {
    filtered = filtered.filter((t) => t.sourceId === params.sourceId);
  }

  return filtered;
}

/**
 * MSW 请求处理器列表
 */
export const handlers = [
  /**
   * 获取信息源列表
   * GET /api/v1/crawler/sources
   */
  http.get('/api/v1/crawler/sources', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const type = url.searchParams.get('type') as GetSourcesParams['type'] | null;
    const enabled = url.searchParams.get('enabled') === 'true' ? true
      : url.searchParams.get('enabled') === 'false' ? false
      : undefined;

    const params: GetSourcesParams = { page, pageSize, type: type || undefined, enabled };
    const filtered = filterSources(mockSources, params);
    const result = paginate(filtered, page, pageSize);

    // 模拟网络延迟
    return HttpResponse.json({
      success: true,
      ...result,
    });
  }),

  /**
   * 创建信息源
   * POST /api/v1/crawler/sources
   */
  http.post('/api/v1/crawler/sources', async ({ request }) => {
    const data = (await request.json()) as CreateSourceDto;
    const newSource = createMockSource({
      ...data,
      id: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastFetchAt: null,
    });

    mockSources.unshift(newSource);

    return HttpResponse.json({
      success: true,
      data: newSource,
    }, { status: 201 });
  }),

  /**
   * 更新信息源
   * PUT /api/v1/crawler/sources/:id
   */
  http.put('/api/v1/crawler/sources/:id', async ({ params, request }) => {
    const { id } = params;
    const data = (await request.json()) as UpdateSourceDto;

    const index = mockSources.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: '信息源不存在' },
        { status: 404 }
      );
    }

    mockSources[index] = {
      ...mockSources[index],
      ...data,
      updatedAt: new Date(),
    };

    return HttpResponse.json({
      success: true,
      data: mockSources[index],
    });
  }),

  /**
   * 删除信息源
   * DELETE /api/v1/crawler/sources/:id
   */
  http.delete('/api/v1/crawler/sources/:id', ({ params }) => {
    const { id } = params;
    const index = mockSources.findIndex((s) => s.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: '信息源不存在' },
        { status: 404 }
      );
    }

    mockSources.splice(index, 1);

    return HttpResponse.json({
      success: true,
    });
  }),

  /**
   * 获取任务列表
   * GET /api/v1/crawler/tasks
   */
  http.get('/api/v1/crawler/tasks', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const status = url.searchParams.get('status') as GetTasksParams['status'] | null;
    const sourceId = url.searchParams.get('sourceId') || undefined;

    const params: GetTasksParams = { page, pageSize, status: status || undefined, sourceId };
    const filtered = filterTasks(mockTasks, params);

    // 按创建时间倒序排序
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const result = paginate(filtered, page, pageSize);

    return HttpResponse.json({
      success: true,
      ...result,
    });
  }),

  /**
   * 创建任务
   * POST /api/v1/crawler/tasks
   */
  http.post('/api/v1/crawler/tasks', async ({ request }) => {
    const data = (await request.json()) as CreateTaskDto;
    const newTask = createMockTask({
      sourceId: data.sourceId,
      status: 'PENDING',
      totalFetched: 0,
      totalParsed: 0,
      totalStored: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      completedAt: null,
    });

    mockTasks.unshift(newTask);

    return HttpResponse.json({
      success: true,
      data: newTask,
    }, { status: 201 });
  }),

  /**
   * 获取任务详情
   * GET /api/v1/crawler/tasks/:id
   */
  http.get('/api/v1/crawler/tasks/:id', ({ params }) => {
    const { id } = params;
    const task = mockTasks.find((t) => t.id === id);

    if (!task) {
      return HttpResponse.json(
        { success: false, message: '任务不存在' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: task,
    });
  }),

  /**
   * 取消任务
   * POST /api/v1/crawler/tasks/:id/cancel
   */
  http.post('/api/v1/crawler/tasks/:id/cancel', ({ params }) => {
    const { id } = params;
    const task = mockTasks.find((t) => t.id === id);

    if (!task) {
      return HttpResponse.json(
        { success: false, message: '任务不存在' },
        { status: 404 }
      );
    }

    if (!['PENDING', 'RUNNING'].includes(task.status)) {
      return HttpResponse.json(
        { success: false, message: '任务状态不允许取消' },
        { status: 400 }
      );
    }

    task.status = 'CANCELLED';
    task.updatedAt = new Date();
    task.completedAt = new Date();

    return HttpResponse.json({
      success: true,
      data: task,
    });
  }),
];

// 临时导入 faker 用于生成 ID
import { faker } from '@faker-js/faker';
