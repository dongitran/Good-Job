import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import {
  Industry,
  CompanySize,
} from '../../../database/entities/organization.entity';

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
}
