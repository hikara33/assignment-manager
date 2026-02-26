import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from "class-validator";

export class RegisterRequest {
  @IsString()
  @IsNotEmpty({ message: "Почта обязвательна для заполнения" })
  @IsEmail({}, { message: "Почта не соответствует формату" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Пароль обязвателен для заполнения" })
  @MinLength(8, { message: "Минимальная длина пароля: 8" })
  password: string;

  @IsString()
  @IsNotEmpty({ message: "Имя обязвательно для заполнения" })
  @Length(2, 50, { message: "Имя должно быть длиной от 2 до 50 символов" })
  name: string;
}