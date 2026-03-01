import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSubjectRequest {
  @IsString()
  @IsNotEmpty({ message: "Название обязательно к заполнению"})
  @MinLength(2, { message: "Минимальная длина названия 2 символа" })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: "Максимальный размер описания 255 символов" })
  description?: string;
}