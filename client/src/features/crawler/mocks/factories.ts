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

  // 根据状态生成合理的进度
  const progressByStatus = {
    PENDING: 0,
    RUNNING: faker.number.int({ min: 10, max: 90 }),
    SUCCESS: 100,
    FAILED: faker.number.int({ min: 0, max: 80 }),
    CANCELLED: faker.number.int({ min: 0, max: 100 }),
  };

  const progress = progressByStatus[status];

  // 根据类型生成不同的结果数据
  const resultBySourceId = (sourceId: string) => {
    const type = sourceId.split('-')[0];
    if (type === 'XUEQIU_USER') {
      return {
        user: faker.person.fullName(),
        followers: faker.number.int({ min: 0, max: 100000 }),
        description: faker.lorem.paragraph(),
        location: faker.location.city(),
      };
    }
    if (type === 'XUEQIU_STATUS') {
      return {
        content: faker.lorem.paragraphs(2),
        targetCount: faker.number.int({ min: 0, max: 1000 }),
        commentCount: faker.number.int({ min: 0, max: 500 }),
        likeCount: faker.number.int({ min: 0, max: 200 }),
      };
    }
    return {
      rawData: faker.lorem.paragraphs(3),
    };
  };

  const hasError = status === 'FAILED';

  return {
    id: faker.string.uuid(),
    sourceId: faker.string.uuid(),
    status,
    progress,
    result: ['SUCCESS', 'FAILED'].includes(status) ? resultBySourceId(faker.string.uuid()) : undefined,
    error: hasError ? faker.helpers.arrayElement([
      '网络超时',
      '目标页面不存在',
      'Cookie已过期',
      '解析失败',
      '请求频率限制',
    ]) : undefined,
    startedAt: ['RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)
      ? faker.date.recent({ days: 1 })
      : null,
    completedAt: ['SUCCESS', 'FAILED', 'CANCELLED'].includes(status)
      ? faker.date.recent({ days: 1 })
      : null,
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
