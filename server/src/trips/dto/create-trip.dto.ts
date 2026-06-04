import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverPhotoUrl?: string | null;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
