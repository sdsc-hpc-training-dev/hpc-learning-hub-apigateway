import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class PersonalPathItemDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(254)
  materialId!: string;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  position!: number;
}
