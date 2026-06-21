import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReminderEmailJob } from 'src/queue/interfaces/email-job.interface';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueAssignments() {
    const now = new Date();

    const result = await this.prisma.assignment.updateMany({
      where: {
        dueDay: { lt: now },
        status: { not: 'COMPLETED' },
      },
      data: { status: 'OVERDUE' },
    });

    this.logger.log(`Marked ${result.count} assignments as OVERDUE`);
  }

  @Cron('0 8 * * *')
  async sendDeadlineReminders() {
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(now.getDate() + 3);

    const start = new Date(reminderDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(reminderDate);
    end.setHours(23, 59, 59, 999);

    const tasks = await this.prisma.assignment.findMany({
      where: {
        dueDay: {
          gte: start,
          lt: end,
        },
        status: 'PENDING',
      },
      include: {
        user: { select: { email: true } },
        group: {
          include: {
            members: {
              include: { user: { select: { email: true } } },
            },
          },
        },
      },
    });

    const jobs: ReminderEmailJob[] = [];

    for (const task of tasks) {
      const emails = new Set<string>();

      if (task.user?.email) emails.add(task.user.email);

      for (const member of task.group?.members ?? []) {
        if (member.user.email) emails.add(member.user.email);
      }

      for (const email of emails) {
        jobs.push({
          type: 'deadline-reminder',
          email,
          taskTitle: task.title,
          dueDay: task.dueDay.toISOString(),
          assignmentId: task.id,
        });
      }
    }

    if (jobs.length > 0) {
      await this.queue.addReminderEmail(jobs);
    }

    this.logger.log(`Sent ${jobs.length} deadline reminders`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanExpiredTokensAndInvites() {
    const now = new Date();

    const deletedTokens = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const expiredInvites = await this.prisma.groupInvite.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });

    this.logger.log(
      `Cleaned ${deletedTokens.count} expired tokens and updated ${expiredInvites.count} invites`,
    );
  }
}
