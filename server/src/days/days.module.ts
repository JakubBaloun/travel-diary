import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Day } from './entities/day.entity';
import { DaysService } from './days.service';
import { DaysAdminController } from './days-admin.controller';
import { DaysController } from './days.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TypeOrmModule.forFeature([Day]), TripsModule],
  controllers: [DaysAdminController, DaysController],
  providers: [DaysService],
  exports: [DaysService],
})
export class DaysModule {}
