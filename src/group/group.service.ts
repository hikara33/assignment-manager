import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteService } from './invite/invite.service';
import { Prisma } from '@prisma/client/extension';

@Injectable()
export class GroupService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly inviteService: InviteService
  ) {}
  
  async createGroup(userId: string, name: string) {
    const existing = await this.prismaService.group.findUnique({
      where: { name },
    });
    if (existing) throw new ConflictException("Группа уже создана");

    return await this.prismaService.$transaction(async (prisma) => {
      const group = await prisma.group.create({
        data: { name },
      });

      await prisma.userGroup.create({
        data: {
          userId,
          groupId: group.id,
          role: "OWNER",
        },
      });

      return group;
    });
  }

  async delete(userId: string, groupId: string) {
    const role = await this.getUserRole(userId, groupId);

    if (role !== "OWNER") throw new ForbiddenException("У вас недостаточно прав");

    await this.prismaService.group.delete({
      where: { id: groupId },
    });
  }

  async shareOwnership(
    currentOwner: string,
    newOwner: string,
    groupId: string
  ) {
    return await this.prismaService.$transaction(async (prisma) => {
      const current = await this.getUserRole(currentOwner, groupId);
      if (current !== "OWNER") throw new ForbiddenException("У вас недостаточно прав");

      const newOwnerMember = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: newOwner,
            groupId,
          },
        },
      });

      if (!newOwnerMember) throw new ForbiddenException("Пользователь не состоит в группе");

      await prisma.userGroup.update({
        where: {
          userId_groupId: {
            userId: newOwner,
            groupId,
          },
        },
        data: { role: "OWNER" },
      });
    });
  }

  private async getUserRole(
    userId: string,
    groupId: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prismaService
  ) {
    const userInGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          groupId,
          userId,
        },
      },
    });

    if (!userInGroup) throw new ForbiddenException("Пользователь не состоит в группе");

    return userInGroup.role;
  }
}
