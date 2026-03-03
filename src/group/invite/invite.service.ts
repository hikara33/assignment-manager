import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InvitePayload } from '../interfaces/jwt-invite.interface';
import * as crypto from 'crypto';

@Injectable()
export class InviteService {
  private readonly JWT_INVITE_TTL: SignOptions["expiresIn"];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.JWT_INVITE_TTL = configService.getOrThrow<SignOptions["expiresIn"]>("JWT_INVITE_TTL");
  }

  async inviteUser(email: string, groupId: string, invitedById: string) {
    const token = this.generateToken(email, groupId, invitedById);
    const hashToken = this.hashToken(token);

    await this.prismaService.$transaction(async (prisma) => {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) throw new NotFoundException("Группа не найдена");

      const inviterMembership = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: invitedById,
            groupId,
          },
        },
      });

      if (!inviterMembership || inviterMembership.role !== "OWNER") {
        throw new ConflictException("Отправлять приглашение может только владелец группы");
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

        if (membership) throw new ConflictException("Пользователь уже состоит в группе");
      }

      const existingInvite = await prisma.groupInvite.findFirst({
        where: {
          email,
          groupId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) throw new ConflictException("Приглашение уже отправлено");

      const invite = await prisma.groupInvite.create({
        data: {
          email,
          token: hashToken,
          groupId,
          invitedById,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
      return invite;
    });
    
    await this.emailService.sendGroupInvite(email, token);
  }

  private generateToken(email: string, groupId: string, invitedById: string) {
    const payload: InvitePayload = {
      email,
      groupId,
      invitedById,
      type: "GROUP_INVITE",
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.JWT_INVITE_TTL,
    });

    return token;
  }

  private hashToken(token: string) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }
}
