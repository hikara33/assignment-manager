import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { InviteModule } from './invite/invite.module';
import { EmailModule } from './email/email.module';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [InviteModule, EmailModule],
})
export class GroupModule {}
