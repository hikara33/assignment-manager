import { Body, Controller, Post } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectRequest } from './dto/create-subject.dto';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { UserRole } from 'src/generated/prisma/enums';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}
}
