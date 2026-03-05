import { Request } from "express";
import { UserRole } from "src/generated/prisma/enums";

export interface AuthRequest extends Request {
  user: {
    name: string;
    id: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }
};