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
import { CacheService } from './services/cache.service';
import { DashboardResult } from './interfaces/dashboard.interface';

@Injectable()
export class AssignmentService {
  private readonly DASHBOARD_TTL = 60;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly conflictDetector: ConflictDetectorService,
    private readonly workload: WorkloadService,
    private readonly scheduler: SchedulerService,
    private readonly cache: CacheService,
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
      const assignment = await this.prismaService.assignment.create({
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

      await this.cache.bumpUserVersion(userId);
      return assignment;
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

    await this.cache.bumpUserVersion(userId);

    return updatedAssignment;
  }

  async remove(userId: string, assignmentId: string): Promise<boolean> {
    await this.assertAssignmentAccess(userId, assignmentId);

    await this.prismaService.assignment.delete({
      where: { id: assignmentId },
    });

    await this.cache.bumpUserVersion(userId);

    return true;
  }

  async updateStatus(
    assignmentId: string,
    status: AssignmentStatus,
    userId: string,
  ) {
    await this.assertAssignmentAccess(userId, assignmentId);

    const updated = await this.prismaService.assignment.update({
      where: { id: assignmentId },
      data: { status },
    });

    await this.cache.bumpUserVersion(userId);

    return updated;
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
    const version = await this.cache.getVersionKey(userId);
    const cacheKey = `dashboard:${userId}:v${version}`;

    const cached = await this.cache.get<DashboardResult>(cacheKey);
    if (cached) return cached;

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

    const result: DashboardResult = {
      workload,
      total,
      pending,
      completed,
      overdue,
      urgent,
    };

    await this.cache.set(cacheKey, result, this.DASHBOARD_TTL);
    return result;
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

  async rescheduleAssignment(userId: string, id: string, to: string) {
    const task = await this.getAssignmentIfAccessible(userId, id);

    if (task.groupId) await this.checkOwner(task.groupId, userId);

    if (task.priority === 'URGENT') {
      throw new ForbiddenException('Cannot reschedule urgent tasks');
    }

    if (task.status === 'COMPLETED')
      throw new ForbiddenException('Cannot reschedule completed task');

    const targetDate = new Date(to);
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new ForbiddenException('Cannot move to past date');
    }

    const currentDate = new Date(task.dueDay);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate.getTime() === targetDate.getTime()) {
      throw new ConflictException('Task is already scheduled for this date');
    }

    const groupIds = await this.getUserGroupIds(userId);
    const visibilityTasks = await this.prismaService.assignment.findMany({
      where: {
        AND: [
          AssignmentQueryBuilder.buildVisibilityWhere(userId, groupIds),
          {
            dueDay: targetDate,
            status: 'PENDING',
          },
        ],
      },
    });

    const scoreDate = visibilityTasks.reduce(
      (sum, t) => sum + this.scheduler.getWeight(t.priority),
      0,
    );

    const taskWeight = this.scheduler.getWeight(task.priority);

    if (!this.scheduler.canFitInDay(scoreDate, taskWeight)) {
      throw new ConflictException('Target day is overloaded');
    }

    const result = await this.prismaService.assignment.update({
      where: { id },
      data: {
        dueDay: targetDate,
      },
    });

    await this.cache.bumpUserVersion(userId);

    return result;
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

  private async checkOwner(groupId: string, userId: string): Promise<void> {
    const membership = await this.prismaService.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (membership.role !== 'OWNER') {
      throw new ForbiddenException(
        'Only group owner can reschedule group assignments',
      );
    }
  }
}
