import { IsOptional, IsBoolean } from 'class-validator';

export class CompleteOnboardingDto {
  @IsBoolean()
  @IsOptional()
  seedDemoData?: boolean;
}
