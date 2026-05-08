import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleAssignmentDto {
  @ApiProperty({ example: '2026-04-01T12:00:00.000Z' })
  @IsDateString({}, { message: 'Дата переноса должна быть валидной датой' })
  to: string;
}
