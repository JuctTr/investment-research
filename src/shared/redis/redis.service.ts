import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConfig } from './redis.constants';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    super(getRedisConfig());
  }

  async onModuleInit() {
    await new Promise((resolve) => {
      this.once('connect', resolve);
      this.once('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });
    });
    this.logger.log('Redis 连接成功');
  }

  async onModuleDestroy() {
    await this.quit();
    this.logger.log('Redis 连接已断开');
  }
}
