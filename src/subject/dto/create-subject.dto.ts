import { IsNotEmpty, IsOptional, IsSemVer, IsString, MinLength } from "class-validator";

export class CreateSubjectRequest {
  @IsString()
  @IsNotEmpty({ message: "Название обязательно к заполнению"})
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}