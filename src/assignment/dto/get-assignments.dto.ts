import { AssignmentPriority, AssignmentStatus } from "src/generated/prisma/enums";

export class GetAssignmentsDto {
  status?: AssignmentStatus
  priority?: AssignmentPriority

  subjectId?: string
  groupId?: string

  search?: string
}