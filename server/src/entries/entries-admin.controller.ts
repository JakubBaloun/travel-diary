import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';
import { EntryType } from '../common/enums/entry-type.enum';
import { UploadService } from '../upload/upload.service';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class EntriesAdminController {
  constructor(
    private readonly entriesService: EntriesService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('days/:dayId/entries')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Param('dayId') dayId: string,
    @Body() dto: CreateEntryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (dto.type === EntryType.PHOTO) {
      if (!file) {
        throw new BadRequestException('Photo file is required for photo entries');
      }
      const url = await this.uploadService.uploadPhoto(file);
      dto.photoUrl = url;
    }

    return this.entriesService.create(dayId, dto);
  }

  @Patch('entries/:id')
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    return this.entriesService.update(id, dto);
  }

  @Delete('entries/:id')
  async remove(@Param('id') id: string) {
    const entry = await this.entriesService.remove(id);

    if (entry.type === EntryType.PHOTO && entry.photoUrl) {
      await this.uploadService.deletePhoto(entry.photoUrl).catch(() => {});
    }
  }
}
