import { IsEnum, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';
import { EntryType } from '../../common/enums/entry-type.enum';

export class CreateEntryDto {
  @IsEnum(EntryType)
  type: EntryType;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
