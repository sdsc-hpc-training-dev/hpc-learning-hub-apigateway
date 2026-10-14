import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PersonalPathItemDto } from './personal-path-item.dto';

export class UpdatePersonalLearningPathDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @IsObject({ each: true })
  @ArrayMaxSize(1000)
  @ArrayUnique((item: PersonalPathItemDto) => item.materialId)
  @ArrayUnique((item: PersonalPathItemDto) => item.position)
  @ValidateNested({ each: true })
  @Type(() => PersonalPathItemDto)
  items?: PersonalPathItemDto[];
}
