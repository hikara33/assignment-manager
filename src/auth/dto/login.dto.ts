import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from "class-validator";

export class LoginRequest {
  @IsString()
  @IsNotEmpty({ message: "Почта обязвательна для заполнения" })
  @IsEmail({}, { message: "Почта не соответствует формату" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Пароль обязвателен для заполнения" })
  @MinLength(8, { message: "Минимальная длина пароля: 8" })
  password: string;
}