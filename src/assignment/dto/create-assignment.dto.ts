import { IsDate, MinDate, IsNotEmpty, IsString, MaxLength, MinLength, IsOptional, IsDateString } from "class-validator";

export class CreateAssignmentRequest {
  @IsString()
  @IsNotEmpty({ message: "Название таска обязательно к заполнению" })
  @MinLength(2, { message: "Минимальная длина названия 2 символа" })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "Максимальный размер описания 255 символов" })
  description?: string;

  @IsDateString({}, { message: "Дата выполнения должна быть валидной датой" })
  // @MinDate(new Date(), { message: "Дата выполнения не может быть в прошлом" })
  dueDay: string;

  subjectId: string;

  @IsOptional()
  groupId: string;
}