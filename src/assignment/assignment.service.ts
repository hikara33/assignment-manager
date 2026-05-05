import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentRequest } from './dto/create-assignment.dto';
import { AssignmentStatus, Prisma } from 'src/generated/prisma/client';
import { UpdateAssignmentRequest } from './dto/update-assignment.dto';
import { GetAssignmentsDto } from './dto/get-assignments.dto';
import { ConflictDetectorService } from './services/conflict-detector.service';
import { WorkloadService } from './services/workload.service';
import { SchedulerService } from './services/sheduler.service';
import { AssignmentQueryBuilder } from './builders/assignment-query.builder';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly conflictDetector: ConflictDetectorService,
    private readonly workload: WorkloadService,
    private readonly scheduler: SchedulerService,
  ) {}

  async create(userId: string, dto: CreateAssignmentRequest) {
    const { title, description, dueDay, subjectId, groupId, priority } = dto;

    const subject = await this.prismaService.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) throw new NotFoundException('Предмет не найден');

    if (groupId) {
      const group = await this.prismaService.group.findUnique({
        where: { id: groupId },
      });
      if (!group) throw new NotFoundException('Группа не найдена');
    }

    try {
      return await this.prismaService.assignment.create({
        data: {
          title,
          description,
          dueDay: new Date(dueDay),
          userId: groupId ? null : userId,
          subjectId,
          groupId,
          priority,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(
            'Задание для такого предмета или группы уже создано',
          );
        }
      }

      throw err;
    }
  }

  async getOne(userId: string, assignmentId: string) {
    return this.getAssignmentIfAccessible(userId, assignmentId);
  }

  async getAll(userId: string, dto: GetAssignmentsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const groupIds = await this.getUserGroupIds(userId);

    const filterWhere = AssignmentQueryBuilder.buildFilterWhere(dto);
    const visibilityWhere = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );

    const where: Prisma.AssignmentWhereInput = {
      AND: [visibilityWhere, filterWhere],
    };

    const { skip, take } = AssignmentQueryBuilder.pagination(page, limit);

    const [assignments, total] = await Promise.all([
      this.prismaService.assignment.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { dueDay: 'asc' }],
        include: {
          subject: true,
          group: true,
        },
        skip,
        take,
      }),

      this.prismaService.assignment.count({ where }),
    ]);

    const lastPage = Math.max(1, Math.ceil(total / limit));

    return {
      data: assignments,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async update(
    userId: string,
    assignmentId: string,
    newData: UpdateAssignmentRequest,
  ) {
    await this.assertAssignmentAccess(userId, assignmentId);

    const updatedAssignment = await this.prismaService.assignment.update({
      where: { id: assignmentId },
      data: {
        title: newData.title,
        description: newData.description,
        dueDay: new Date(newData.dueDay),
        priority: newData.priority,
      },
    });
    return updatedAssignment;
  }

  async remove(userId: string, assignmentId: string): Promise<boolean> {
    await this.assertAssignmentAccess(userId, assignmentId);

    await this.prismaService.assignment.delete({
      where: { id: assignmentId },
    });
    return true;
  }

  async updateStatus(
    assignmentId: string,
    status: AssignmentStatus,
    userId: string,
  ) {
    await this.assertAssignmentAccess(userId, assignmentId);

    return await this.prismaService.assignment.update({
      where: { id: assignmentId },
      data: { status },
    });
  }

  async getAllForGroup(groupId: string, dto?: GetAssignmentsDto) {
    const { skip, take } = AssignmentQueryBuilder.pagination(
      dto?.page ?? 1,
      dto?.limit ?? 10,
    );

    const [assignments, total] = await Promise.all([
      this.prismaService.assignment.findMany({
        where: { groupId },
        orderBy: [{ priority: 'desc' }, { dueDay: 'asc' }],
        include: {
          subject: true,
          group: true,
        },
        skip,
        take,
      }),
      this.prismaService.assignment.count({ where: { groupId } }),
    ]);

    return {
      data: assignments,
      meta: {
        total,
        page: dto?.page ?? 1,
        lastPage: Math.ceil(total / (dto?.limit ?? 10)),
      },
    };
  }

  async getDashboard(userId: string) {
    const now = new Date();
    const groupIds = await this.getUserGroupIds(userId);
    const visible = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );

    const [workload, total, pending, completed, overdue, urgent] =
      await Promise.all([
        this.workload.getWorkload(userId, groupIds),

        this.prismaService.assignment.count({
          where: visible,
        }),

        this.prismaService.assignment.count({
          where: { AND: [visible, { status: 'PENDING' }] },
        }),

        this.prismaService.assignment.count({
          where: { AND: [visible, { status: 'COMPLETED' }] },
        }),

        this.prismaService.assignment.count({
          where: {
            AND: [
              visible,
              {
                dueDay: { lt: now },
                status: { not: 'COMPLETED' },
              },
            ],
          },
        }),

        this.prismaService.assignment.count({
          where: {
            AND: [
              visible,
              {
                priority: 'URGENT',
                status: { not: 'COMPLETED' },
              },
            ],
          },
        }),
      ]);

    return {
      workload,
      total,
      pending,
      completed,
      overdue,
      urgent,
    };
  }

  async detectConflicts(userId: string) {
    const groupIds = await this.getUserGroupIds(userId);
    const visible = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );
    const tasks = await this.prismaService.assignment.findMany({
      where: { AND: [visible, { status: 'PENDING' }] },
    });

    return this.conflictDetector.detect(tasks);
  }

  async getRescheduleSuggestions(userId: string) {
    const groupIds = await this.getUserGroupIds(userId);
    const visible = AssignmentQueryBuilder.buildVisibilityWhere(
      userId,
      groupIds,
    );
    const tasks = await this.prismaService.assignment.findMany({
      where: { AND: [visible, { status: 'PENDING' }] },
    });

    return this.scheduler.suggestReschedule(tasks);
  }

  private async getUserGroupIds(userId: string): Promise<string[]> {
    const rows = await this.prismaService.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    return rows.map((r) => r.groupId);
  }

  /** Одна задание с предметом и группой, если у пользователя есть доступ */
  private async getAssignmentIfAccessible(
    userId: string,
    assignmentId: string,
  ) {
    const assignment = await this.prismaService.assignment.findUnique({
      where: { id: assignmentId },
      include: { subject: true, group: true },
    });

    if (!assignment) throw new NotFoundException('Задание не найдено');

    if (assignment.userId === userId) return assignment;

    if (assignment.groupId) {
      const member = await this.prismaService.userGroup.findUnique({
        where: {
          userId_groupId: { userId, groupId: assignment.groupId },
        },
      });
      if (member) return assignment;
    }

    throw new ForbiddenException('Нет доступа к этому заданию');
  }

  private async assertAssignmentAccess(
    userId: string,
    assignmentId: string,
  ): Promise<void> {
    await this.getAssignmentIfAccessible(userId, assignmentId);
  }
}
