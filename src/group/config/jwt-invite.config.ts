import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function getJwtInviteConfig(
  configService: ConfigService,
): JwtModuleOptions {
  return {
    secret: configService.getOrThrow<string>('JWT_INVITE_SECRET'),
    signOptions: {
      algorithm: 'HS256',
    },
    verifyOptions: {
      algorithms: ['HS256'],
      ignoreExpiration: false,
    },
  };
}
