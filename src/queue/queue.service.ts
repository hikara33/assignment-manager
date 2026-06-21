import { Queue } from 'bullmq';
import { RedisService } from 'src/redis/redis.service';
import {
  EmailJobData,
  ReminderEmailJob,
} from './interfaces/email-job.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueueService {
  private readonly emailQueue: Queue<EmailJobData>;
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly redisService: RedisService) {
    this.emailQueue = new Queue('emails', {
      connection: redisService.getConnectionOptions(),
    });
  }

  async addInviteEmail(email: string, token: string) {
    const job = await this.emailQueue.add(
      'invite',
      {
        type: 'invite',
        email,
        token,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
    this.logger.log(`Queued invite email job ${job.id} for ${email}`);
  }

  async addReminderEmail(jobs: ReminderEmailJob[]) {
    const bulk = jobs.map((job) => ({
      name: job.type,
      data: job,
      opts: {
        jobId: `deadline-reminder:${job.assignmentId}:${job.email}`,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }));

    await this.emailQueue.addBulk(bulk);
  }
}
