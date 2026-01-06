import { Module } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module";
import { XueqiuModule } from "../xueqiu/xueqiu.module";
import { WechatModule } from "../wechat/wechat.module";
import { CrawlerController } from "./crawler.controller";
import { CrawlerService } from "./crawler.service";
import { GenericCrawlerProcessor } from "./generic-crawler.processor";
import { RateLimitService } from "./rate-limit.service";
import { CrawlerScheduleService } from "./schedule/crawler-schedule.service";
import { DefaultScheduleStrategyProvider } from "./schedule/strategies/default-schedule.strategy";
import { WechatScheduleStrategyProvider } from "./schedule/strategies/wechat-schedule.strategy";

@Module({
  imports: [QueueModule, XueqiuModule, WechatModule],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    GenericCrawlerProcessor,
    RateLimitService,
    CrawlerScheduleService,
    DefaultScheduleStrategyProvider,
    WechatScheduleStrategyProvider,
  ],
  exports: [CrawlerService, CrawlerScheduleService, RateLimitService],
})
export class CrawlerModule {}
