import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../guards/jwt.guard";
import { UserRole } from "src/generated/prisma/enums";
import { Roles } from "./role.decorator";
import { RolesGuard } from "../guards/roles.guard";

export function Authorization(...roles: UserRole[]) {
  if (roles.length > 0) {
    return applyDecorators(Roles(...roles), UseGuards(JwtGuard, RolesGuard));
  }

  return applyDecorators(UseGuards(JwtGuard));
}