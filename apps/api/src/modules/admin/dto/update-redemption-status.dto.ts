import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RedemptionStatus } from '../../../database/entities';

export class UpdateRedemptionStatusDto {
  @IsEnum(RedemptionStatus)
  status: RedemptionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fulfillmentNote?: string;
}
