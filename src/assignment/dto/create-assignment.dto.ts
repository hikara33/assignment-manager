import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AssignmentPriority } from 'src/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentRequest {
  @ApiProperty({ example: 'Lab #3' })
  @IsString()
  @IsNotEmpty({ message: 'Название обязательно к заполнению' })
  @MinLength(2, { message: 'Минимальная длина названия 2 символа' })
  title: string;

  @ApiPropertyOptional({ example: 'Подготовить отчет и отправить до дедлайна' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Максимальный размер описания 255 символов' })
  description?: string;

  @ApiProperty({ example: '2026-04-01T12:00:00.000Z' })
  @IsDateString({}, { message: 'Дата выполнения должна быть валидной датой' })
  dueDay: string;

  @ApiProperty({ example: 'subject-id-uuid' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ example: 'group-id-uuid' })
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({
    enum: AssignmentPriority,
    example: AssignmentPriority.MEDIUM,
  })
  priority?: AssignmentPriority;
}
