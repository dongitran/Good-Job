import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RewardCategory } from '../../../database/entities';

export class UpdateRewardDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pointsCost?: number;

  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  /** Stock quantity. Use -1 for unlimited. */
  @IsOptional()
  @IsInt()
  @Min(-1)
  stock?: number;
}
