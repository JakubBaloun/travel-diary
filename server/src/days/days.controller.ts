import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DaysService } from './days.service';
import { TripsService } from '../trips/trips.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('trips/:slug/days')
@UseGuards(JwtAuthGuard)
export class DaysController {
  constructor(
    private readonly daysService: DaysService,
    private readonly tripsService: TripsService,
  ) {}

  @Get(':dayNumber')
  async findByDayNumber(
    @Param('slug') slug: string,
    @Param('dayNumber') dayNumber: string,
  ) {
    const trip = await this.tripsService.findBySlug(slug);
    return this.daysService.findByTripIdAndDayNumber(trip.id, parseInt(dayNumber, 10));
  }
}
