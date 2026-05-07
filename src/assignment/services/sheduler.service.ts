import { Injectable } from '@nestjs/common';
import { Assignment, AssignmentPriority } from 'src/generated/prisma/client';
import { SuggestReschedule } from '../interfaces/suggestion.interface';

@Injectable()
export class SchedulerService {
  private readonly THRESHOLD = 7;
  private readonly MAX_SEARCH_DAYS = 7;

  private readonly weights: Record<AssignmentPriority, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 5,
  };

  suggestReschedule(tasks: Assignment[]): SuggestReschedule[] {
    const grouped = this.groupByDate(tasks);
    const scores = this.calculateScores(grouped);
    const suggestions: SuggestReschedule[] = [];

    
  }

  private groupByDate(tasks: Assignment[]) {
    const grouped = new Map<string, Assignment[]>();

    for (const task of tasks) {
      const date = task.dueDay.toLocaleDateString('sv-SE');

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }

      grouped.get(date)!.push(task);
    }

    return grouped;
  }

  private calculateScores(grouped: Map<string, Assignment[]>) {
    const scores = new Map<string, number>();

    for (const [date, tasks] of grouped.entries()) {
      const score = tasks.reduce((sum, task) => {
        return sum + this.weights[task.priority];
      }, 0);

      scores.set(date, score);
    }

    return scores;
  }
}
