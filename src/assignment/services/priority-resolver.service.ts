import { Injectable } from '@nestjs/common';
import { Assignment } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignmentQueryBuilder } from '../builders/assignment-query.builder';

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
      .map((task) => ({
        ...task,
        score: this.calculateScore(task),
      }))
      .sort((a, b) => b.score - a.score);
  }

  calculateScore(a: Assignment) {
    const priorityWeight: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      URGENT: 4,
    };

    const now = Date.now();
    const due = new Date(a.dueDay).getTime();

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = (due - now) / msPerDay;

    // const urgency = Math.exp(-Math.max(daysLeft, -5));
    // const priorityFactor = priorityWeight[a.priority] || 1;

    // let overdueFactor = 0;
    // if (daysLeft < 0 && a.status !== 'COMPLETED') {
    //   overdueFactor = Math.min(Math.abs(daysLeft) * 10 + 20, 100);
    // }

    // const score = urgency * 100 * priorityFactor + overdueFactor;
    // return score;
    let urgencyScore: number;
    if (daysLeft > 7) urgencyScore = 1;
    else if (daysLeft > 3) urgencyScore = 2;
    else if (daysLeft > 1) urgencyScore = 3;
    else if (daysLeft > 0) urgencyScore = 4;
    else urgencyScore = 5 + Math.min(Math.abs(daysLeft), 5);

    const priorityScore = priorityWeight[a.priority] || 1;

    return priorityScore * 10 + urgencyScore * 15;
  }
}
