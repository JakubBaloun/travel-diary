import { IsInt, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDayDto {
  @IsInt()
  dayNumber: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsString()
  coverPhotoUrl?: string | null;
}
