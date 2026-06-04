import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';

@Controller('admin/upload')
@UseGuards(AdminKeyGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    const url = await this.uploadService.uploadPhoto(file);
    return { url };
  }
}
