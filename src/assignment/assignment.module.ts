import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { PriorityResolverService } from './services/priority-resolver.service';

@Module({
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    PriorityResolverService
  ]
})
export class AssignmentModule {}
