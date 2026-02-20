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

export class CreateRewardDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsPositive()
  pointsCost: number;

  @IsEnum(RewardCategory)
  category: RewardCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  /**
   * Stock quantity. Use -1 for unlimited.
   * Must be >= -1.
   */
  @IsInt()
  @Min(-1)
  stock: number;
}
