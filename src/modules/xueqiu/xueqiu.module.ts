import { Module } from '@nestjs/common';
import { XueqiuService } from './xueqiu.service';
import { StatusCrawlerService } from './status-crawler.service';
import { XueqiuController } from './xueqiu.controller';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { StatusRepository } from './repositories/status.repository';
import { BrowserModule } from '../browser/browser.module';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [BrowserModule, ParserModule],
  controllers: [XueqiuController],
  providers: [
    XueqiuService,
    StatusCrawlerService,
    UserProfileRepository,
    StatusRepository,
  ],
  exports: [XueqiuService, StatusCrawlerService, UserProfileRepository, StatusRepository],
})
export class XueqiuModule {}
