import { Assignment } from 'src/generated/prisma/client';

export interface ConflictResult {
  date: string;
  score: number;
  count: number;
  tasks: Assignment[];
}
