import { IsUUID, IsString, Matches } from 'class-validator';

export class VerifyLoginDto {
  @IsUUID()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
