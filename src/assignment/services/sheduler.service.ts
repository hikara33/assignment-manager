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
    const mutableScores = new Map(scores);

    const suggestions: SuggestReschedule[] = [];

    for (const [date, dayTasks] of grouped) {
      const score = mutableScores.get(date)!;

      if (score < this.THRESHOLD) continue;

      const movable = [...dayTasks]
        .filter((task) => this.isMovable(task))
        .sort((a, b) => {
          const priorityDiff =
            this.weights[a.priority] - this.weights[b.priority];

          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          return b.dueDay.getTime() - a.dueDay.getTime();
        });

      for (const task of movable) {
        const currentScore = mutableScores.get(date)!;
        if (currentScore < this.THRESHOLD) break;

        const bestDate = this.findBestTargetDate(task, mutableScores);

        if (!bestDate) {
          continue;
        }

        const cost = this.weights[task.priority];

        //обновляем счетчик как для нового дня, так и для старого
        mutableScores.set(
          //старый
          date,
          currentScore - cost,
        );

        mutableScores.set(
          //новый
          bestDate,
          (mutableScores.get(bestDate) ?? 0) + cost,
        );

        suggestions.push({
          taskId: task.id,
          taskTitle: task.title,

          priority: task.priority,

          from: task.dueDay,
          to: new Date(bestDate),

          reason: 'Reduce workload on overloaded day',
        });
      }
    }

    return suggestions;
  }

  private groupByDate(tasks: Assignment[]) {
    const grouped = new Map<string, Assignment[]>();

    for (const task of tasks) {
      const date = task.dueDay.toISOString().slice(0, 10);

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

  private isMovable(task: Assignment) {
    if (task.priority === 'URGENT') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.dueDay);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today;
  }

  private findBestTargetDate(task: Assignment, scores: Map<string, number>) {
    let bestDate: string | null = null;
    let bestScore = Infinity;

    for (let offset = 1; offset <= this.MAX_SEARCH_DAYS; offset++) {
      const candidate = new Date(task.dueDay);
      candidate.setDate(candidate.getDate() + offset);

      const key = candidate.toISOString().slice(0, 10);

      const candidateScore = scores.get(key) ?? 0;
      const newScore = candidateScore + this.weights[task.priority];

      if (newScore >= this.THRESHOLD) continue; //нахуй нам дата не нужна

      const cost = newScore + offset * 0.2;

      if (cost < bestScore) {
        bestScore = cost;
        bestDate = key;
      }
    }

    return bestDate;
  }
}
