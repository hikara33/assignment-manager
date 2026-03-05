import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthRequest } from "../interfaces/request.interface";

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userId = request.user.id;
    const groupId = request.params.id as string;

    const membership = await this.prismaService.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      throw new ForbiddenException("У вас недостаточно прав");
    }

    return true;
  }
}