import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripsAdminController } from './trips-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trip]), AuthModule],
  controllers: [TripsController, TripsAdminController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
