import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginRequest } from './dto/login.dto';
import { Authorization } from './decorators/authorization.decorator';
import { Authorized } from './decorators/authorized.decorator';
import { UserRole, type User } from 'src/generated/prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiBody({ type: RegisterRequest })
  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterRequest,
  ) {
    return await this.authService.register(res, dto);
  }

  @ApiOperation({ summary: 'Логин пользователя' })
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({ description: 'Access token выдан' })
  @Post('login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest,
  ) {
    return await this.authService.login(res, dto);
  }

  @ApiOperation({ summary: 'Выход пользователя' })
  @ApiOkResponse({ description: 'Сессия завершена' })
  @Get('logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return await this.authService.logout(res, req);
  }

  @ApiOperation({ summary: 'Обновление access token через refresh token' })
  @ApiOkResponse({ description: 'Access token обновлен' })
  @Get('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return await this.authService.refresh(res, req);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  @Authorization()
  @Get('profile')
  getProfile(@Authorized() user: User) {
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список пользователей (только ADMIN)' })
  @Authorization(UserRole.ADMIN)
  @Get('admin')
  async getAll() {
    return await this.authService.getAll();
  }
}
