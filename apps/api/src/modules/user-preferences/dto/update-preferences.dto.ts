import {
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ThemePreference } from '../../../database/entities';

export class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  kudosReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  redemptionStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  newAnnouncements?: boolean;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notificationSettings?: NotificationSettingsDto;
}
