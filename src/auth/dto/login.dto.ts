import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsNotEmpty({ message: 'Почта обязвательна для заполнения' })
  @IsEmail({}, { message: 'Почта не соответствует формату' })
  email: string;

  @ApiProperty({ example: 'qwerty123' })
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязвателен для заполнения' })
  @MinLength(8, { message: 'Минимальная длина пароля: 8' })
  password: string;
}
