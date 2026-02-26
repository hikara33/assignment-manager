import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SignOptions } from 'jsonwebtoken';
import { isDev } from 'src/utils/is-dev.utils';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.intreface';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginRequest } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: SignOptions['expiresIn'];
  private readonly JWT_REFRESH_TOKEN_TTL: SignOptions['expiresIn'];

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<SignOptions['expiresIn']>('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<SignOptions['expiresIn']>('JWT_REFRESH_TOKEN_TTL');

    this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  async register(res: Response, dto: RegisterRequest) {
    const { email, name, password } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) throw new ConflictException('Пользователь с такой почтой уже существует');

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashPassword,
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return await this.auth(res, user.id, user.name);
  }

  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      throw new NotFoundException("Пользователь не найден");
    }

    return await this.auth(res, user.id, user.name);
  }

  async refresh(res: Response, req: Request) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException("Недействительный refresh-токен");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException("Недействительный refresh-токен");
    }

    const tokens = await this.prismaService.refreshToken.findMany({
      where: {
        userId: payload.id,
      },
    });

    const tokenEntity = await Promise.any(
      tokens.map(async (token) => {
        const match = await bcrypt.compare(refreshToken, token.hashToken);
        if (match) return token;
        throw new Error();
      })
    ).catch(() => null);

    if (!tokenEntity) {
      await this.prismaService.refreshToken.deleteMany({
        where: {
          userId: payload.id,
        },
      });

      throw new UnauthorizedException("Reused detected");
    }

    await this.prismaService.refreshToken.delete({
      where: {
        id: tokenEntity.id,
      },
    });

    return await this.auth(res, payload.id, payload.name);
  }

  async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
    return true;
  }

  private generateTokens(id: string, name: string) {
    const payload: JwtPayload = { id, name };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      expires,
      secure: false,
      sameSite: 'lax',
    });
  }

  private async auth(res: Response, id: string, name: string) {
    const { accessToken, refreshToken } = this.generateTokens(id, name);

    const hashToken = await bcrypt.hash(refreshToken, 10);

    await this.prismaService.refreshToken.create({
      data: {
        userId: id,
        hashToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    this.setCookie(
      res,
      refreshToken,
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    );
    
    return { accessToken };
  }

  async validate(payload: JwtPayload) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
      }
    });

    if (!user) throw new NotFoundException("Пользователь не найден");
    
    return user;
  }

  async getAll() {
    return await this.prismaService.user.findMany();
  }
}