import { Assignment } from "src/generated/prisma/client";

export interface ConflictResult {
  date: string;
  count: number;
  tasks: Assignment[];
}