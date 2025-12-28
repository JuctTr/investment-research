import { Module } from '@nestjs/common';
import { XueqiuParserService } from './xueqiu-parser.service';

@Module({
  providers: [XueqiuParserService],
  exports: [XueqiuParserService],
})
export class ParserModule {}
