import { Injectable } from '@nestjs/common';
import { Assignment } from 'src/generated/prisma/client';
import { ConflictResult } from '../interfaces/conflict.interface';

@Injectable()
export class ConflictDetectorService {
  detect(tasks: Assignment[]): ConflictResult[] {
    const map: Record<string, Assignment[]> = {};

    for (const task of tasks) {
      const date = task.dueDay.toISOString().slice(0, 10);

      if (!map[date]) {
        map[date] = [];
      }

      map[date].push(task);
    }

    return Object.entries(map)
      .filter(([, tasks]) => tasks.length >= 3)
      .map(([date, tasks]) => ({
        date,
        count: tasks.length,
        tasks,
      }));
  }
}
