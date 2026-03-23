import { Prisma } from 'src/generated/prisma/client';
import { GetAssignmentsDto } from '../dto/get-assignments.dto';

export class AssignmentQueryBuilder {
  static buildWhere(
    userId: string,
    dto: GetAssignmentsDto,
  ): Prisma.AssignmentWhereInput {
    const { status, priority, subjectId, groupId, search } = dto;

    return {
      userId,

      ...(status && { status }),
      ...(priority && { priority }),
      ...(subjectId && { subjectId }),
      ...(groupId && { groupId }),

      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };
  }

  static pagination(page = 1, limit = 10) {
    const safeLimit = Math.min(limit, 50);

    return {
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    };
  }
}
