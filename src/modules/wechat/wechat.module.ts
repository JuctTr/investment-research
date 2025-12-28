import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';
import { WechatProcessor } from './wechat.processor';
import { WechatAccountRepository } from './repositories/wechat-account.repository';
import { WechatArticleRepository } from './repositories/wechat-article.repository';
import { WechatParserService } from './services/wechat-parser.service';
import { WechatSogouService } from './services/wechat-sogou.service';
import { WechatPcService } from './services/wechat-pc.service';
import { WechatHealthService } from './services/wechat-health.service';
import { WechatScheduleService } from './schedule/wechat-schedule.service';
import { QueueModule } from '../queue/queue.module';
import { BrowserModule } from '../browser/browser.module';

@Module({
  imports: [
    QueueModule,
    BrowserModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WechatController],
  providers: [
    WechatService,
    WechatProcessor,
    WechatAccountRepository,
    WechatArticleRepository,
    WechatParserService,
    WechatSogouService,
    WechatPcService,
    WechatHealthService,
    WechatScheduleService,
  ],
  exports: [
    WechatService,
    WechatAccountRepository,
    WechatArticleRepository,
    WechatParserService,
    WechatSogouService,
    WechatPcService,
    WechatHealthService,
  ],
})
export class WechatModule {}
