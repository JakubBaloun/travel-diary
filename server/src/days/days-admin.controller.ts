import { Controller, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DaysService } from './days.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class DaysAdminController {
  constructor(private readonly daysService: DaysService) {}

  @Post('trips/:tripId/days')
  create(@Param('tripId') tripId: string, @Body() dto: CreateDayDto) {
    return this.daysService.create(tripId, dto);
  }

  @Patch('days/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDayDto) {
    return this.daysService.update(id, dto);
  }

  @Delete('days/:id')
  remove(@Param('id') id: string) {
    return this.daysService.remove(id);
  }
}
