import { Injectable } from "@nestjs/common";
import { Assignment } from "src/generated/prisma/client";
import { SuggestReschedule } from "../interfaces/suggestion.interface";

@Injectable()
export class SchedulerService {
  suggestReschedule(tasks: Assignment[]) {
    const map: Record<string, Assignment[]> = {};

    for (const task of tasks) {
      const date = task.dueDay.toISOString().slice(0, 10);

      if (!map[date]) {
        map[date] = [];
      }

      map[date].push(task);
    }
    
    const suggestions: SuggestReschedule[] = [];

    for (const [date, tasks] of Object.entries(map)) {
      if (tasks.length > 3) {
        const overflow = tasks.slice(3);

        overflow.forEach((task, index) => {
          const newDate = new Date(task.dueDay);
          newDate.setDate(newDate.getDate() + index + 1);

          suggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            from: task.dueDay,
            to: newDate
          })
        });
      }
    }

    return suggestions;
  }
}