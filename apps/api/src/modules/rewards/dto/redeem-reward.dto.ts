import { IsString, IsUUID } from 'class-validator';

export class RedeemRewardDto {
  @IsString()
  @IsUUID()
  idempotencyKey: string;
}
