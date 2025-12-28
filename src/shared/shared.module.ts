import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [HttpModule, RedisModule],
  exports: [HttpModule, RedisModule],
})
export class SharedModule {}
