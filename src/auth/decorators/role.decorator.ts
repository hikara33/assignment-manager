import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/generated/prisma/enums";

export const ROLE_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);