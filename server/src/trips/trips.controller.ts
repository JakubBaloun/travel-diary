import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findAll() {
    return this.tripsService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tripsService.findBySlug(slug);
  }
}
