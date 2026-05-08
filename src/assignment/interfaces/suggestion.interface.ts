import { AssignmentPriority } from 'src/generated/prisma/enums';

export interface SuggestReschedule {
  taskId: string;
  taskTitle: string;

  priority: AssignmentPriority;

  from: Date;
  to: Date;

  reason: string;
}
