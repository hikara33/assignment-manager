import { Prisma } from 'src/generated/prisma/client';
import { GetAssignmentsDto } from '../dto/get-assignments.dto';

export class AssignmentQueryBuilder {
  static buildFilterWhere(dto: GetAssignmentsDto): Prisma.AssignmentWhereInput {
    const { status, priority, subjectId, groupId, search } = dto;

    return {
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

  static buildVisibilityWhere(
    userId: string,
    groupIds: string[],
  ): Prisma.AssignmentWhereInput {
    const or: Prisma.AssignmentWhereInput[] = [{ userId }];
    if (groupIds.length > 0) {
      or.push({ groupId: { in: groupIds } });
    }
    return { OR: or };
  }

  static pagination(page = 1, limit = 10) {
    const safeLimit = Math.min(limit, 50);

    return {
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    };
  }
}
