import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AssignmentModule } from './assignment/assignment.module';
import { SubjectModule } from './subject/subject.module';
import { GroupModule } from './group/group.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { AutomationService } from './cron/automation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    AssignmentModule,
    SubjectModule,
    GroupModule,
    ScheduleModule.forRoot(),
    RedisModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, AutomationService],
})
export class AppModule {}
