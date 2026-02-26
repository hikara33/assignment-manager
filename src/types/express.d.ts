import { User } from "src/generated/prisma/client";

export module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}