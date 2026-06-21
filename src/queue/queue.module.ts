import { Module } from '@nestjs/common';
import { EmailModule } from 'src/group/email/email.module';
import { QueueService } from './queue.service';
import { EmailWorker } from './workers/email.worker';

@Module({
  imports: [EmailModule],
  providers: [QueueService, EmailWorker],
  exports: [QueueService],
})
export class QueueModule {}
