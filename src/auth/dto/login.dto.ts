import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(254)
  emailOrUsername!: string;

  @IsString()
  @MinLength(15)
  @MaxLength(128)
  password!: string;
}
