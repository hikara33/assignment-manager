import { Body, Controller, Post } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentRequest } from './dto/create-assignment.dto';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}
}
