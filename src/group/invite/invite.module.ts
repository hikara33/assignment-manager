import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJwtInviteConfig } from '../config/jwt-invite.config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getJwtInviteConfig,
      inject: [ConfigService]
    }),
    EmailModule
  ],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
