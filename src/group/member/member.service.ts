import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupService } from '../group.service';

@Injectable()
export class MemberService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly groupService: GroupService
  ) {}

  async leaveGroup(userId: string, groupId: string) {
    return await this.prismaService.$transaction(async (prisma) => {
      const membership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId, groupId },
        },
      });
      if (!membership) throw new ForbiddenException("Вы не участник группы");

      if (membership.role === "OWNER") {
        const ownersCount = await prisma.userGroup.count({
          where: {
            groupId,
            role: "OWNER",
          },
        });
        if (ownersCount === 1) throw new ForbiddenException("Нельзя выйти из группы, если вы единственный владелец");
      }

      await prisma.userGroup.delete({
        where: {
          userId_groupId: { userId, groupId },
        },
      });

      return { message: "Вы покинули группу" };
    });
  }

  async removeMember(
    ownerId: string,
    memberId: string,
    groupId: string
  ) {
    return await this.prismaService.$transaction(async (prisma) => {
      const checkRole = await this.groupService.getUserRole(ownerId, groupId, prisma);
      if (checkRole !== "OWNER") throw new ForbiddenException("У вас недостаточно прав");

      const member = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: { userId: memberId, groupId },
        },
      });
      if (!member) throw new ForbiddenException("Пользователь не состоит в группе");
      if (member.role === "OWNER") {
        throw new ForbiddenException("Нельзя удалить владельца");
      }

      await prisma.userGroup.delete({
        where: {
          userId_groupId: { userId: memberId, groupId },
        },
      });

      return { message: "Вы удалили пользователя" };
    });
  }

  async getUsersGroup(groupId: string) {
    return await this.prismaService.userGroup.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
