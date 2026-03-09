import { forwardRef, Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { GroupModule } from '../group.module';

@Module({
  providers: [MemberService],
  imports: [forwardRef(() => GroupModule)],
  exports: [MemberService]
})
export class MemberModule {}
