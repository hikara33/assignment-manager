import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { UserRole } from 'src/generated/prisma/enums';
import { CreateSubjectRequest } from './dto/create-subject.dto';
import { UpdateSubjectRequest } from './dto/update-subject.dto';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Authorization(UserRole.ADMIN)
  @Post('create')
  async create(@Body() dto: CreateSubjectRequest) {
    return await this.subjectService.create(dto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.subjectService.getOne(id);
  }

  @Get()
  async getAll() {
    return await this.subjectService.getAll();
  }

  @Authorization(UserRole.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectRequest
  ) {
    return await this.subjectService.put(id, dto);
  }

  @Authorization(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.subjectService.remove(id);
  }
}
