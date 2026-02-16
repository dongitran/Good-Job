import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../../../database/entities';

export class RequestTokenDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  orgId?: string;
}
