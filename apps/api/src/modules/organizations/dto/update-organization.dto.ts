import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Matches,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Industry,
  CompanySize,
} from '../../../database/entities/organization.entity';

export class PointsSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  minPerKudo?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10000)
  maxPerKudo?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000000)
  valueInCurrency?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;
}

export class BudgetSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(100000)
  monthlyGivingBudget?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(31)
  resetDay?: number;

  @IsBoolean()
  @IsOptional()
  allowRollover?: boolean;

  @IsBoolean()
  @IsOptional()
  managerBonusEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10000)
  managerBonusAmount?: number;
}

export class OrganizationSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PointsSettingsDto)
  points?: PointsSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetSettingsDto)
  budget?: BudgetSettingsDto;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsEnum(Industry)
  @IsOptional()
  industry?: Industry;

  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  timezone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;

  @IsString()
  @IsOptional()
  @MaxLength(253)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Invalid domain format',
  })
  companyDomain?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationSettingsDto)
  settings?: OrganizationSettingsDto;
}
