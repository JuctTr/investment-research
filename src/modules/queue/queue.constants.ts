export const QUEUE_NAMES = {
  GENERIC_CRAWLER: 'generic-crawler',
  COOKIE_REFRESH: 'cookie-refresh',
  WECHAT_CRAWLER: 'WECHAT_CRAWLER',
} as const;

export const QUEUE_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_MAX_RETRY, 10) || 3,
    backoff: {
      type: (process.env.QUEUE_BACKOFF_TYPE as any) || 'exponential',
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY, 10) || 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600, // 7 days
    },
  },
} as const;
