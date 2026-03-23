import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  AssignmentPriority,
  AssignmentStatus,
} from 'src/generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAssignmentsDto {
  @ApiPropertyOptional({
    enum: AssignmentStatus,
    example: AssignmentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({
    enum: AssignmentPriority,
    example: AssignmentPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(AssignmentPriority)
  priority?: AssignmentPriority;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ example: 'lab' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
