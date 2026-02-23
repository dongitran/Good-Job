import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoreValueItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  emoji?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCoreValuesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CoreValueItemDto)
  values: CoreValueItemDto[];

  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}
