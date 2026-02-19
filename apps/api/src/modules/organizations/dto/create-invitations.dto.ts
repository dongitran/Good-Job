import { IsArray, IsEmail, ArrayMinSize } from 'class-validator';

export class CreateInvitationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}
