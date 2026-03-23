import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SignOptions } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt.intreface';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginRequest } from './dto/login.dto';
import ms from 'ms';
import type { CookieOptions } from 'express';
import type { RefreshToken } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: NonNullable<SignOptions['expiresIn']>;
  private readonly JWT_REFRESH_TOKEN_TTL: NonNullable<SignOptions['expiresIn']>;

  private readonly COOKIE_DOMAIN?: string;
  private readonly COOKIE_SECURE: boolean;
  private readonly COOKIE_SAME_SITE: CookieOptions['sameSite'];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<
      NonNullable<SignOptions['expiresIn']>
    >('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<
      NonNullable<SignOptions['expiresIn']>
    >('JWT_REFRESH_TOKEN_TTL');

    this.COOKIE_DOMAIN = this.configService.get<string>('COOKIE_DOMAIN');
    this.COOKIE_SECURE =
      this.configService.get<string>('COOKIE_SECURE', 'true') === 'true';
    this.COOKIE_SAME_SITE = this.configService.get<CookieOptions['sameSite']>(
      'COOKIE_SAME_SITE',
      'lax',
    );
  }

  async register(res: Response, dto: RegisterRequest) {
    const { email, name, password } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser)
      throw new ConflictException('Пользователь с такой почтой уже существует');

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
      throw new NotFoundException('Пользователь не найден');
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      throw new NotFoundException('Пользователь не найден');
    }

    return await this.auth(res, user.id, user.name);
  }

  async refresh(res: Response, req: Request) {
    const refreshToken = this.getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    const tokens = await this.prismaService.refreshToken.findMany({
      where: {
        userId: payload.id,
      },
    });

    const tokenEntity = await this.findMatchingRefreshToken(
      refreshToken,
      tokens,
    );

    if (!tokenEntity) {
      await this.prismaService.refreshToken.deleteMany({
        where: {
          userId: payload.id,
        },
      });

      throw new UnauthorizedException('Reused detected');
    }

    await this.prismaService.refreshToken.delete({
      where: {
        id: tokenEntity.id,
      },
    });

    return await this.auth(res, payload.id, payload.name);
  }

  async logout(res: Response, req: Request) {
    const refreshToken = this.getRefreshTokenFromRequest(req);

    if (refreshToken) {
      const tokens = await this.prismaService.refreshToken.findMany({
        where: {
          userId: await this.decodeUserIdFromRefreshToken(refreshToken),
        },
      });
      const tokenEntity = await this.findMatchingRefreshToken(
        refreshToken,
        tokens,
      );

      if (tokenEntity) {
        await this.prismaService.refreshToken.delete({
          where: { id: tokenEntity.id },
        });
      }
    }

    this.setCookie(res, '', new Date(0));
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
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      expires,
      secure: this.COOKIE_SECURE,
      sameSite: this.COOKIE_SAME_SITE,
    };

    if (this.COOKIE_DOMAIN) {
      cookieOptions.domain = this.COOKIE_DOMAIN;
    }

    res.cookie('refreshToken', value, cookieOptions);
  }

  private getRefreshTokenExpiryDate() {
    return new Date(
      Date.now() + this.getTtlInMilliseconds(this.JWT_REFRESH_TOKEN_TTL),
    );
  }

  private getTtlInMilliseconds(ttl: NonNullable<SignOptions['expiresIn']>) {
    if (typeof ttl === 'number') {
      return ttl * 1000;
    }

    const parsed = ms(ttl);
    if (typeof parsed !== 'number') {
      throw new UnauthorizedException('Invalid token TTL');
    }

    return parsed;
  }

  private async decodeUserIdFromRefreshToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload.id;
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }
  }

  private getRefreshTokenFromRequest(req: Request): string | null {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const refreshToken = cookies?.refreshToken;
    return typeof refreshToken === 'string' ? refreshToken : null;
  }

  private async findMatchingRefreshToken(
    refreshToken: string,
    tokens: RefreshToken[],
  ): Promise<RefreshToken | null> {
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.hashToken);
      if (isMatch) {
        return token;
      }
    }

    return null;
  }

  private async auth(res: Response, id: string, name: string) {
    const { accessToken, refreshToken } = this.generateTokens(id, name);

    const hashToken = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiryDate();

    await this.prismaService.refreshToken.create({
      data: {
        userId: id,
        hashToken,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    this.setCookie(res, refreshToken, refreshTokenExpiresAt);

    return { accessToken };
  }

  async validate(payload: JwtPayload) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    return user;
  }

  async getAll() {
    return await this.prismaService.user.findMany();
  }
}
