import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignmentQueryBuilder } from '../builders/assignment-query.builder';

@Injectable()
export class WorkloadService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkload(userId: string, groupIds: string[]) {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const week = new Date();
    week.setDate(now.getDate() + 7);

    const visible = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );

    const [today, tomorrowTasks, weekTasks] = await Promise.all([
      this.prisma.assignment.count({
        where: {
          AND: [
            visible,
            {
              dueDay: {
                gte: now,
                lt: tomorrow,
              },
            },
          ],
        },
      }),

      this.prisma.assignment.count({
        where: {
          AND: [
            visible,
            {
              dueDay: {
                gte: tomorrow,
                lt: week,
              },
            },
          ],
        },
      }),

      this.prisma.assignment.count({
        where: {
          AND: [
            visible,
            {
              dueDay: {
                gte: now,
                lt: week,
              },
            },
          ],
        },
      }),
    ]);

    return {
      today,
      tomorrow: tomorrowTasks,
      week: weekTasks,
    };
  }
}
