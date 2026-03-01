import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAssignmentRequest {
  @IsString()
  @IsNotEmpty({ message: "Название обязательно к заполнению"})
  @MinLength(2, { message: "Минимальная длина названия 2 символа" })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: "Максимальный размер описания 255 символов" })
  description?: string;

  @IsDateString({}, { message: "Дата выполнения должна быть валидной датой" })
  dueDay: string;
}