import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import  type { Request, Response } from 'express';
import { LoginRequest } from './dto/login.dto';
import { Authorization } from './decorators/authorization.decorator';
import { Authorized } from './decorators/authorized.decorator';
import { UserRole, type User } from 'src/generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterRequest
  ) {
    return await this.authService.register(res, dto);
  }

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest
  ) {
    return await this.authService.login(res, dto);
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(res);
  }

  @Get('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    return await this.authService.refresh(res, req);
  }

  @Authorization()
  @Get('profile')
  getProfile(@Authorized() user: User) {
    return user;
  }

  @Authorization(UserRole.ADMIN)
  @Get('admin')
  async getAll() {
    return await this.authService.getAll();
  }
}