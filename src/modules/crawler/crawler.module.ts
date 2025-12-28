import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { StatusCrawlerService } from './status-crawler.service';
import { QueueModule } from '../queue/queue.module';
import { BrowserModule } from '../browser/browser.module';
import { ParserModule } from '../parser/parser.module';
import { XueqiuModule } from '../xueqiu/xueqiu.module';

@Module({
  imports: [QueueModule, BrowserModule, ParserModule, XueqiuModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerProcessor, StatusCrawlerService],
  exports: [CrawlerService, StatusCrawlerService],
})
export class CrawlerModule {}
