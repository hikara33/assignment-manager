import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentRequest } from './dto/create-assignment.dto';
import { Prisma } from 'src/generated/prisma/client';
import { UpdateAssignmentRequest } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async create(userId: string, dto: CreateAssignmentRequest) {
    const { title, description, dueDay, subjectId, groupId } = dto;

    const subject = await this.prismaService.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) throw new NotFoundException("Предмет не найден");

    if (groupId) {
      const group = await this.prismaService.group.findUnique({
        where: { id: groupId},
      });
      if (!group) throw new NotFoundException("Группа не найдена");
    }

    try {
      return await this.prismaService.assignment.create({
        data: {
          title,
          description,
          dueDay: new Date(dueDay),
          userId,
          subjectId,
          groupId,
        },
      });
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException("Задание для такого предмета или группы уже создано");
        }
      }

      throw err;
    }
  }

  async getOne(userId: string, assignmentId: string) {
    await this.isOwner(userId, assignmentId);

    const assignment = await this.prismaService.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new NotFoundException("Задание не найдено");
    return assignment;
  }

  async getAll(userId: string) {
    return await this.prismaService.assignment.findMany({
      where: {
        userId,
      },
    });
  }

  async update(userId: string, assignmentId: string, newData: UpdateAssignmentRequest) {
    await this.isOwner(userId, assignmentId);

    const updatedAssignment = await this.prismaService.assignment.update({
      where: { id: assignmentId },
      data: {
        title: newData.title,
        description: newData.description,
        dueDay: new Date(newData.dueDay),
      },
    });
    return updatedAssignment;
  }

  async remove(userId: string, assignmentId: string): Promise<boolean> {
    await this.isOwner(userId, assignmentId);

    await this.prismaService.assignment.delete({
      where: { id: assignmentId },
    });
    return true;
  }

  private async isOwner(userId: string, assignmentId: string): Promise<void> {
    const assignment = await this.prismaService.assignment.findUnique({
      where: { id: assignmentId },
      select: { userId: true },
    });

    if (!assignment) throw new NotFoundException("Задание не найдено");

    if (userId !== assignment.userId) {
      throw new ForbiddenException("Вы не являетесь владельцем этого задания");
    }
  }
}