import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentRequest } from './dto/create-assignment.dto';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { UpdateAssignmentRequest } from './dto/update-assignment.dto';

@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Authorization()
  @Post('create')
  async create(
    @Authorized('id') id: string,
    @Body() dto: CreateAssignmentRequest
  ) {
    return await this.assignmentService.create(id, dto);
  }

  @Authorization()
  @Get(':id')
  async getOne(
    @Authorized('id') userId: string,
    @Param('id') assignmentId: string
  ) {
    return await this.assignmentService.getOne(userId, assignmentId);
  }

  @Authorization()
  @Get()
  async getAll(@Authorized('id') id: string) {
    return await this.assignmentService.getAll(id);
  }

  @Authorization()
  @Patch(':id')
  async update(
    @Authorized('id') userId: string,
    @Param('id') assignmentId: string,
    @Body() dto: UpdateAssignmentRequest
  ) {
    return await this.assignmentService.update(userId, assignmentId, dto);
  }

  @Authorization()
  @Delete(':id')
  async remove(
    @Authorized('id')userId: string,
    @Param('id') assignmentId: string
  ) {
    return await this.assignmentService.remove(userId, assignmentId);
  }
}