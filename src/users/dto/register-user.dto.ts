import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,50}$/)
  username!: string;

  @IsString()
  @MinLength(15)
  @MaxLength(128)
  password!: string;
}
