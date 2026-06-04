import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { AccessKeyGuard } from '../common/guards/access-key.guard';

@Controller('trips')
@UseGuards(AccessKeyGuard)
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
