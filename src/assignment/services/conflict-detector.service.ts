import { Injectable } from '@nestjs/common';
import { Assignment } from 'src/generated/prisma/client';
import { ConflictResult } from '../interfaces/conflict.interface';

@Injectable()
export class ConflictDetectorService {
  private readonly THRESHOLD = 7;

  private readonly weights = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 5,
  };

  detect(tasks: Assignment[]): ConflictResult[] {
    const grouped: Record<string, Assignment[]> = {};

    for (const task of tasks) {
      const date = task.dueDay.toLocaleDateString('sv-SE');

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(task);
    }

    return Object.entries(grouped)
      .map(([date, tasks]) => {
        const score = tasks.reduce((sum, task) => {
          return sum + this.weights[task.priority];
        }, 0);

        return {
          date,
          score,
          count: tasks.length,
          tasks,
        };
      })
      .filter((day) => day.score >= this.THRESHOLD)
      .sort((a, b) => b.score - a.score);
  }
}
