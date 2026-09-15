import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class ParticipantLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Team Code is required' })
  teamCode!: string;

  @IsOptional()
  @IsString()
  accessCode?: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  memberOrder?: number;
}
