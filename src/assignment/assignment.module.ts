import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { PriorityResolverService } from './services/priority-resolver.service';
import { ConflictDetectorService } from './services/conflict-detector.service';
import { WorkloadService } from './services/workload.service';

@Module({
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    PriorityResolverService,
    ConflictDetectorService,
    WorkloadService
  ]
})
export class AssignmentModule {}
