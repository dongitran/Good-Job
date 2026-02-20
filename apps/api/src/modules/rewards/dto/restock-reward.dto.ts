import { IsInt, IsPositive } from 'class-validator';

export class RestockRewardDto {
  /** Number of units to add to current stock. */
  @IsInt()
  @IsPositive()
  quantity: number;
}
