import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { WechatModule } from './modules/wechat/wechat.module';
import { CommonModule } from './common/common.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // 配置模块 - 必须放在最前面
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // 数据库模块
    DatabaseModule,

    // 爬虫模块
    CrawlerModule,
    WechatModule,

    // 基础设施模块
    CommonModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}