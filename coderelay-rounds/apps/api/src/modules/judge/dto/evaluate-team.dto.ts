import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class EvaluateTeamDto {
  @IsString()
  teamId!: string;

  @IsNumber()
  @Min(0, { message: 'Score must be greater than or equal to 0' })
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
