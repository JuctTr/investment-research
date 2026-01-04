import { Module } from '@nestjs/common';
import { CrawlerController, XueqiuCrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { GenericCrawlerProcessor } from './generic-crawler.processor';
import { StatusCrawlerService } from './status-crawler.service';
import { QueueModule } from '../queue/queue.module';
import { BrowserModule } from '../browser/browser.module';
import { ParserModule } from '../parser/parser.module';
import { XueqiuModule } from '../xueqiu/xueqiu.module';

@Module({
  imports: [QueueModule, BrowserModule, ParserModule, XueqiuModule],
  controllers: [CrawlerController, XueqiuCrawlerController],
  providers: [CrawlerService, GenericCrawlerProcessor, StatusCrawlerService],
  exports: [CrawlerService, StatusCrawlerService],
})
export class CrawlerModule {}
