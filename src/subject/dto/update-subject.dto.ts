import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubjectRequest {
  @ApiProperty({ example: 'Physics' })
  @IsString()
  @IsNotEmpty({ message: 'Название обязательно к заполнению' })
  @MinLength(2, { message: 'Минимальная длина названия 2 символа' })
  name: string;

  @ApiPropertyOptional({ example: 'Mechanics and thermodynamics' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Максимальный размер описания 255 символов' })
  description?: string;
}
