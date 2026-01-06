/**
 * Mock 数据工厂函数
 * 使用 Faker.js 生成真实的测试数据
 */
import { faker } from '@faker-js/faker';
import type { CrawlerSource, CrawlerTask } from '../types';

/**
 * 生成Mock信息源
 */
export const createMockSource = (overrides?: Partial<CrawlerSource>): CrawlerSource => {
  const type = faker.helpers.arrayElement(['XUEQIU_USER', 'XUEQIU_STATUS', 'WECHAT', 'RSS'] as const);

  // 根据不同类型生成对应的URL
  const urlByType = {
    XUEQIU_USER: `https://xueqiu.com/u/${faker.string.numeric(6)}`,
    XUEQIU_STATUS: `https://xueqiu.com/u/${faker.string.numeric(6)}/status`,
    WECHAT: `https://mp.weixin.qq.com/s/${faker.string.alphanumeric(16)}`,
    RSS: `https://example.com/feed/${faker.string.uuid()}.xml`,
  };

  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement([
      '张三的雪球主页',
      '李四的投资笔记',
      '王五的公众号',
      '财经新闻RSS',
      '雪球大V分析',
    ]),
    type,
    url: urlByType[type],
    enabled: faker.datatype.boolean(0.7), // 70%概率为启用
    lastFetchAt: faker.datatype.boolean(0.5) ? faker.date.recent({ days: 7 }) : null,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 1 }),
    ...overrides,
  };
};

/**
 * 生成多个Mock信息源
 */
export const createMockSources = (count: number): CrawlerSource[] => {
  return Array.from({ length: count }, () => createMockSource());
};

/**
 * 生成Mock任务
 */
export const createMockTask = (overrides?: Partial<CrawlerTask>): CrawlerTask => {
  const status = faker.helpers.arrayElement(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'] as const);

  // 根据状态生成合理的统计数字
  const statsByStatus = {
    PENDING: { fetched: 0, parsed: 0, stored: 0 },
    RUNNING: {
      fetched: faker.number.int({ min: 10, max: 500 }),
      parsed: faker.number.int({ min: 5, max: 450 }),
      stored: faker.number.int({ min: 0, max: 400 }),
    },
    SUCCESS: {
      fetched: faker.number.int({ min: 50, max: 1000 }),
      parsed: faker.number.int({ min: 45, max: 950 }),
      stored: faker.number.int({ min: 40, max: 900 }),
    },
    FAILED: {
      fetched: faker.number.int({ min: 0, max: 100 }),
      parsed: faker.number.int({ min: 0, max: 80 }),
      stored: 0,
    },
    CANCELLED: {
      fetched: faker.number.int({ min: 0, max: 50 }),
      parsed: faker.number.int({ min: 0, max: 40 }),
      stored: faker.number.int({ min: 0, max: 30 }),
    },
  };

  const stats = statsByStatus[status];

  const hasError = status === 'FAILED';

  return {
    id: faker.string.uuid(),
    sourceId: faker.string.uuid(),
    status,
    scheduledAt: faker.date.recent({ days: 1 }),
    startedAt: ['RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)
      ? faker.date.recent({ days: 1 })
      : null,
    completedAt: ['SUCCESS', 'FAILED', 'CANCELLED'].includes(status)
      ? faker.date.recent({ days: 1 })
      : null,
    totalFetched: stats.fetched,
    totalParsed: stats.parsed,
    totalStored: stats.stored,
    errorMessage: hasError ? faker.helpers.arrayElement([
      '网络超时',
      '目标页面不存在',
      'Cookie已过期',
      '解析失败',
      '请求频率限制',
      '无法从页面提取用户数据',
    ]) : null,
    errorStack: hasError ? `Error: ${faker.helpers.arrayElement([
      '网络超时',
      '目标页面不存在',
    ])}\n    at ${faker.system.filePath()}:${faker.number.int({ min: 1, max: 100 }) }:${faker.number.int({ min: 1, max: 50 })}` : null,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 1 }),
    ...overrides,
  };
};

/**
 * 生成多个Mock任务
 */
export const createMockTasks = (count: number): CrawlerTask[] => {
  return Array.from({ length: count }, () => createMockTask());
};

/**
 * 生成特定状态的Mock任务
 */
export const createMockTasksByStatus = (count: number, status: CrawlerTask['status']): CrawlerTask[] => {
  return Array.from({ length: count }, () => createMockTask({ status }));
};
