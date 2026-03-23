import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InvitePayload } from '../interfaces/jwt-invite.interface';
import * as crypto from 'crypto';
import { GroupInvite, Prisma, User } from 'src/generated/prisma/client';

@Injectable()
export class InviteService {
  private readonly JWT_INVITE_TTL: SignOptions['expiresIn'];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.JWT_INVITE_TTL =
      configService.getOrThrow<SignOptions['expiresIn']>('JWT_INVITE_TTL');
  }

  async inviteUser(email: string, groupId: string, invitedById: string) {
    const token = this.generateToken(email, groupId, invitedById);
    const hashToken = this.hashToken(token);

    const result = await this.prismaService.$transaction(async (prisma) => {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) throw new NotFoundException('Группа не найдена');

      const inviterMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: invitedById,
            groupId,
          },
        },
      });

      if (!inviterMembership || inviterMembership.role !== 'OWNER') {
        throw new ConflictException(
          'Отправлять приглашение может только владелец группы',
        );
      }

      const existUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existUser) {
        const membership = await prisma.userGroup.findUnique({
          where: {
            userId_groupId: {
              userId: existUser.id,
              groupId,
            },
          },
        });

        if (membership)
          throw new ConflictException('Пользователь уже состоит в группе');
      }

      const existingInvite = await prisma.groupInvite.findFirst({
        where: {
          email,
          groupId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite)
        throw new ConflictException('Приглашение уже отправлено');

      const invite = await prisma.groupInvite.create({
        data: {
          email,
          token: hashToken,
          groupId,
          invitedById,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
      return invite;
    });

    await this.emailService.sendGroupInvite(email, token);
    return result;
  }

  async acceptInvite(token: string, userId: string) {
    const payload: InvitePayload = await this.verifyToken(token);

    return await this.prismaService.$transaction(async (prisma) => {
      const invite = await this.getInviteByToken(token, prisma);
      this.ensureInvitePending(invite);
      await this.ensureInviteNotExpired(invite, prisma);

      const user = await this.getUserById(userId, prisma);
      this.ensureInviteForUser(user.email, invite.email);

      const existingMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: payload.groupId,
          },
        },
      });
      if (existingMembership)
        throw new ConflictException('Пользователь уже состоит в группе');

      await prisma.userGroup.create({
        data: {
          userId,
          groupId: payload.groupId,
        },
      });
      await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', usedAt: new Date() },
      });

      return { message: 'Вы успешно присоединились к группе' };
    });
  }

  async declineInvite(token: string, userId: string) {
    await this.verifyToken(token);

    return this.prismaService.$transaction(async (prisma) => {
      const invite = await this.getInviteByToken(token, prisma);
      this.ensureInvitePending(invite);
      await this.ensureInviteNotExpired(invite, prisma);

      const user = await this.getUserById(userId, prisma);
      this.ensureInviteForUser(user.email, invite.email);

      await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: 'DECLINED', usedAt: new Date() },
      });

      return { message: 'Вы отклонили приглашение' };
    });
  }

  private generateToken(email: string, groupId: string, invitedById: string) {
    const payload: InvitePayload = {
      email,
      groupId,
      invitedById,
      type: 'GROUP_INVITE',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.JWT_INVITE_TTL,
    });

    return token;
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async verifyToken(token: string): Promise<InvitePayload> {
    try {
      const payload: InvitePayload = await this.jwtService.verifyAsync(token);

      if (payload.type !== 'GROUP_INVITE') {
        throw new ForbiddenException('Невалидный токен');
      }

      return payload;
    } catch {
      throw new ForbiddenException('Инвайт истек или невалиден');
    }
  }

  private async getInviteByToken(
    token: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prismaService,
  ) {
    const tokenHash = this.hashToken(token);

    const invite = await prisma.groupInvite.findUnique({
      where: { token: tokenHash },
    });
    if (!invite) {
      throw new NotFoundException('Приглашение не найдено');
    }

    return invite;
  }

  private ensureInvitePending(invite: GroupInvite) {
    if (invite.status !== 'PENDING') {
      throw new ConflictException('Приглашение уже обработано');
    }
  }

  private async ensureInviteNotExpired(
    invite: GroupInvite,
    prisma: Prisma.TransactionClient | PrismaService = this.prismaService,
  ) {
    if (invite.expiresAt < new Date()) {
      await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      throw new ForbiddenException('Приглашение истекло');
    }
  }

  private ensureInviteForUser(userEmail: string, inviteEmail: string) {
    if (userEmail !== inviteEmail) {
      throw new ForbiddenException('Это приглашение не для вас');
    }
  }

  private async getUserById(
    userId: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prismaService,
  ): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    return user;
  }
}
