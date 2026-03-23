import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from 'src/group/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
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

    const taskDue = await this.prisma.assignment.findMany({
      where: {
        dueDay: {
          gte: start,
          lt: end,
        },
        status: 'PENDING',
      },
      include: { user: { select: { email: true } } },
    });

    await Promise.all(
      taskDue.map((task) =>
        this.emailService.sendAssignmentReminder(
          task.user.email,
          task.title,
          task.dueDay,
        ),
      ),
    );

    this.logger.log(`Sent ${taskDue.length} deadline reminders`);
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
