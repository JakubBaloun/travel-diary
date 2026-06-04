import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry } from './entities/entry.entity';
import { EntriesService } from './entries.service';
import { EntriesAdminController } from './entries-admin.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Entry]), UploadModule],
  controllers: [EntriesAdminController],
  providers: [EntriesService],
})
export class EntriesModule {}
