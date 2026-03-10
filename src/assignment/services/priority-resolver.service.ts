import { Injectable } from "@nestjs/common";
import { Assignment } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PriorityResolverService {
  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async getPrioritizedAssignments(userId: string) {
    const tasks = await this.prismaService.assignment.findMany({
      where: { userId },
    });

    return tasks.map(task => ({
      ...task,
      score: this.calculateScore(task),
    }))
    .sort((a, b) => b.score - a.score);
  }

  calculateScore(a: Assignment) {
    const priorityWeight = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      URGENT: 4
    };

    const now = new Date();
    const daysLeft =
      (a.dueDay.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    let score = priorityWeight[a.priority] * 10;
    score+= Math.max(0, 10 - daysLeft);

    if (a.dueDay < now && a.status !== "COMPLETED") {
      score+= 20;
    }

    return score;
  }
}