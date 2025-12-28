import { Module } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { CookiePoolService } from './cookie-pool.service';

@Module({
  providers: [BrowserService, CookiePoolService],
  exports: [BrowserService, CookiePoolService],
})
export class BrowserModule {}
