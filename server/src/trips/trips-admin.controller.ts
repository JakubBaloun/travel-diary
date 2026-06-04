import { Controller, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';

@Controller('admin/trips')
@UseGuards(AdminKeyGuard)
export class TripsAdminController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }
}
