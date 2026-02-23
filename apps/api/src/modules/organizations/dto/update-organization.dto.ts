import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
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
}

export class BudgetSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(100000)
  monthlyGivingBudget?: number;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationSettingsDto)
  settings?: OrganizationSettingsDto;
}
