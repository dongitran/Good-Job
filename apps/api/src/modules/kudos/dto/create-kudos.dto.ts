import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateKudosDto {
  @IsUUID()
  receiverId: string;

  @IsInt()
  @Min(1)
  points: number;

  @IsUUID()
  valueId: string;

  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters.' })
  message: string;
}
