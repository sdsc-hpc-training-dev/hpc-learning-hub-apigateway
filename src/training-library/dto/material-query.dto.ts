import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ResourceType } from '../../database/entities/persistence.enums';

export class MaterialQueryDto {
  @IsOptional()
  @IsIn(['websearch', 'phrase'])
  searchMode?: 'websearch' | 'phrase';

  @IsOptional()
  @IsIn(['recommended', 'title'])
  sort?: 'recommended' | 'title';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  tool?: string;

  @IsOptional()
  @IsString()
  system?: string;

  @IsOptional()
  @IsString()
  eventSeries?: string;

  @IsOptional()
  @IsString()
  eventEdition?: string;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(ResourceType)
  resourceType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
