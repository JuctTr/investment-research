import { CrawlerModule } from "@/modules/crawler/crawler.module";
import { CrawlerScheduleService } from "@/modules/crawler/schedule/crawler-schedule.service";
import { DefaultScheduleStrategyProvider } from "@/modules/crawler/schedule/strategies/default-schedule.strategy";
import { WechatScheduleStrategyProvider } from "@/modules/crawler/schedule/strategies/wechat-schedule.strategy";
import { WechatModule } from "@/modules/wechat/wechat.module";
import { QueueModule } from "@/modules/queue/queue.module";
import { Module } from "@nestjs/common";
import { ScheduleModule as NestScheduleModule } from "@nestjs/schedule";

/**
 * 调度模块
 * 负责所有定时任务调度
 */
@Module({
  imports: [
    NestScheduleModule.forRoot(),
    CrawlerModule,
    WechatModule,
    QueueModule,
  ],
  providers: [
    CrawlerScheduleService,
    DefaultScheduleStrategyProvider,
    WechatScheduleStrategyProvider,
  ],
  exports: [CrawlerScheduleService],
})
export class SchedulerModule {}
