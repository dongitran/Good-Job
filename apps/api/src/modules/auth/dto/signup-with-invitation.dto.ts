import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpWithInvitationDto {
  @IsString()
  @IsNotEmpty()
  inviteToken: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
