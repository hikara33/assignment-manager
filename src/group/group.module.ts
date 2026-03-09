import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { InviteModule } from './invite/invite.module';
import { EmailModule } from './email/email.module';
import { MemberModule } from './member/member.module';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [InviteModule, EmailModule, forwardRef(() => MemberModule)],
  exports: [GroupService],
})
export class GroupModule {}
