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
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { photoUploadOptions } from './multer.config';

@Controller('admin/upload')
@UseGuards(AdminAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo', photoUploadOptions))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    const url = await this.uploadService.uploadPhoto(file);
    return { url };
  }
}
