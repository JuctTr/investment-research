import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ContentModule } from './modules/content/content.module';
import { ViewpointModule } from './modules/viewpoint/viewpoint.module';
import { DecisionModule } from './modules/decision/decision.module';
import { ReviewModule } from './modules/review/review.module';
import { AiModule } from './modules/ai/ai.module';
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

    // 核心业务模块
    ContentModule,
    ViewpointModule,
    DecisionModule,
    ReviewModule,
    AiModule,

    // 基础设施模块
    CommonModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}