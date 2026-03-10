import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { WorkloadResult } from "../interfaces/workload.interface";

@Injectable()
export class WorkloadService {
  constructor(
    private readonly prisma: PrismaService
  ) {}
  async getWorkload(userId: string) {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const week = new Date();
    week.setDate(now.getDate() + 7);

    const [today, tomorrowTasks, weekTasks] = await Promise.all([
      this.prisma.assignment.count({
        where: {
          userId,
          dueDay: {
            gte: now,
            lt: tomorrow
          }
        }
      }),

      this.prisma.assignment.count({
        where: {
          userId,
          dueDay: {
            gte: tomorrow,
            lt: week
          }
        }
      }),

      this.prisma.assignment.count({
        where: {
          userId,
          dueDay: {
            gte: now,
            lt: week
          }
        }
      })
    ]);

    return {
      today,
      tomorrow: tomorrowTasks,
      week: weekTasks
    };
  }

  generatesuggestions(workload: WorkloadResult) {
    const suggestions: string[] = [];

    if (workload.tomorrow >= 4) {
      suggestions.push(
        "You have many tasks tomorrow. Consider starting today"
      );
    }

    if (workload.today === 0) {
      suggestions.push(
        "No tasks today. Good time to start upcoming work ^^"
      );
    }

    return suggestions;
  }
}