import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QUEUE_NAMES, QUEUE_CONFIG } from './queue.constants';

@Module({
  imports: [
    BullModule.forRoot({
      connection: QUEUE_CONFIG.connection,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.XUEQIU_CRAWLER,
      defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
