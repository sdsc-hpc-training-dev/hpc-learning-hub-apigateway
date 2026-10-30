import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { FoundWhatNeeded } from '../../database/entities/site-feedback.entity';

export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsIn(['yes', 'partly', 'no', 'just_browsing'])
  foundWhatNeeded?: FoundWhatNeeded | null;

  @IsOptional()
  @IsString()
  workedWell?: string | null;

  @IsOptional()
  @IsString()
  improvements?: string | null;
}
