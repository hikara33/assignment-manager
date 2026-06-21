import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { EmailService } from 'src/group/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { EmailJobData } from '../interfaces/email-job.interface';

@Injectable()
export class EmailWorker implements OnModuleInit {
  private worker: Worker | undefined;
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.logger.log('Email worker started');

    this.worker = new Worker(
      'emails',
      async (job: Job<EmailJobData>) => {
        switch (job.data.type) {
          case 'invite':
            await this.emailService.sendGroupInvite(
              job.data.email,
              job.data.token,
            );
            break;

          case 'deadline-reminder':
            await this.emailService.sendAssignmentReminder(
              job.data.email,
              job.data.taskTitle,
              new Date(job.data.dueDay),
            );
            break;
        }
      },
      {
        connection: this.redis.getConnectionOptions(),
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job?.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed`, err.stack);
    });

    this.worker.on('error', (err) => {
      this.logger.error('Email worker error', err.stack);
    });
  }
}
