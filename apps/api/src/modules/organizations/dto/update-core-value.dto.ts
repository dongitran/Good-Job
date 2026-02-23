import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateCoreValueDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  emoji?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;
}

export class ReorderCoreValuesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
