import { Injectable } from '@nestjs/common';
import { Assignment } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignmentQueryBuilder } from '../builders/assignment-query.builder';
import { MetaData } from '../interfaces/priority-resolver.interface';

@Injectable()
export class PriorityResolverService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPrioritizedAssignments(userId: string) {
    const rows = await this.prismaService.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = rows.map((r) => r.groupId);
    const visible = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );

    const tasks = await this.prismaService.assignment.findMany({
      where: {
        ...visible,
        status: {
          notIn: ['COMPLETED', 'ARCHIVED'],
        },
      },
    });

    return tasks
      .map((task) => {
        const meta = this.getMeta(task);
        return {
          ...task,
          ...meta,
          score: this.calculateScore(task, meta),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private getMeta(a: Assignment): MetaData {
    const now = Date.now();
    const due = new Date(a.dueDay).getTime();

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysLeft = (due - now) / MS_PER_DAY;

    const isOverdue = daysLeft < 0;
    const isDueToday = daysLeft >= 0 && daysLeft < 1;
    const isDueSoon = daysLeft >= 1 && daysLeft <= 3;

    return {
      daysLeft,
      isOverdue,
      isDueToday,
      isDueSoon,
    };
  }

  private calculateScore(a: Assignment, meta: MetaData) {
    const priorityWeight: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      URGENT: 4,
    };
    // const urgency = Math.exp(-Math.max(daysLeft, -5));
    // const priorityFactor = priorityWeight[a.priority] || 1;

    // let overdueFactor = 0;
    // if (daysLeft < 0 && a.status !== 'COMPLETED') {
    //   overdueFactor = Math.min(Math.abs(daysLeft) * 10 + 20, 100);
    // }

    // const score = urgency * 100 * priorityFactor + overdueFactor;
    // return score;
    const priorityScore = priorityWeight[a.priority] || 1;

    let urgencyScore = 0;
    if (meta.isOverdue) {
      const overdueDays = Math.abs(meta.daysLeft);

      if (overdueDays < 1) urgencyScore = 6;
      else if (overdueDays < 3) urgencyScore = 7;
      else urgencyScore = 6;
    } else if (meta.isDueToday) {
      urgencyScore = 5;
    } else if (meta.isDueSoon) {
      urgencyScore = 4;
    } else if (meta.daysLeft <= 7) {
      urgencyScore = 3;
    } else {
      urgencyScore = 1;
    }

    return priorityScore * 15 + urgencyScore * 12;
  }
}
