import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { UserRole } from 'src/generated/prisma/enums';
import { CreateSubjectRequest } from './dto/create-subject.dto';
import { UpdateSubjectRequest } from './dto/update-subject.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Subject')
@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать предмет (только ADMIN)' })
  @ApiBody({ type: CreateSubjectRequest })
  @Authorization(UserRole.ADMIN)
  @Post('create')
  async create(@Body() dto: CreateSubjectRequest) {
    return await this.subjectService.create(dto);
  }

  @ApiOperation({ summary: 'Получить список предметов' })
  @Get()
  async getAll() {
    return await this.subjectService.getAll();
  }

  @ApiOperation({ summary: 'Получить предмет по id' })
  @ApiParam({ name: 'id', description: 'ID предмета' })
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.subjectService.getOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить предмет (только ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID предмета' })
  @ApiBody({ type: UpdateSubjectRequest })
  @Authorization(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSubjectRequest) {
    return await this.subjectService.put(id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить предмет (только ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID предмета' })
  @Authorization(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.subjectService.remove(id);
  }
}
