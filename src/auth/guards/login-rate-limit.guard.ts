import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BruteForceService } from '../services/brute-force.service';
import { Request } from 'express';

type LoginBody = {
  email?: string;
};

type RequestWithLoginBody = Request<Record<string, string>, any, LoginBody>;

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly bruteForceService: BruteForceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithLoginBody>();

    const ip = req.ip ?? '';
    const email = req.body.email ?? '';

    if (!email) return true;

    await this.bruteForceService.checkBlocked(ip, email);
    return true;
  }
}
