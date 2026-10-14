import { IsString, Matches, MaxLength } from 'class-validator';

export class AddBookmarkDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(254)
  materialId!: string;
}
