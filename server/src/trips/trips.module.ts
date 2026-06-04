import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsAdminController } from './trips-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trip])],
  controllers: [TripsController, TripsAdminController],
  providers: [TripsService],
})
export class TripsModule {}
