import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLE_KEY } from "../decorators/role.decorator";
import { Request } from "express";
import { User } from "src/generated/prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesContext = this.reflector.getAllAndOverride(ROLE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!rolesContext) return true;

    const request = context.switchToHttp().getRequest() as Request;
    const user = request.user as User;

    if (!rolesContext.includes(user.role)) {
      throw new ForbiddenException("У вас недостаточно прав");
    }

    return true;
  }
}