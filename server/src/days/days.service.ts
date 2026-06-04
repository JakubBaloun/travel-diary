import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Day } from './entities/day.entity';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';

@Injectable()
export class DaysService {
  constructor(
    @InjectRepository(Day)
    private readonly dayRepository: Repository<Day>,
  ) {}

  async findByTripIdAndDayNumber(tripId: string, dayNumber: number): Promise<Day> {
    const day = await this.dayRepository.findOne({
      where: { tripId, dayNumber },
      relations: { entries: true },
      order: { entries: { sortOrder: 'ASC' } },
    });

    if (!day) {
      throw new NotFoundException('Day not found');
    }

    return day;
  }

  async create(tripId: string, dto: CreateDayDto): Promise<Day> {
    const day = this.dayRepository.create({ ...dto, tripId });
    return this.dayRepository.save(day);
  }

  async update(id: string, dto: UpdateDayDto): Promise<Day> {
    const day = await this.dayRepository.preload({ id, ...dto });

    if (!day) {
      throw new NotFoundException('Day not found');
    }

    return this.dayRepository.save(day);
  }

  async remove(id: string): Promise<void> {
    const day = await this.dayRepository.findOneBy({ id });

    if (!day) {
      throw new NotFoundException('Day not found');
    }

    await this.dayRepository.remove(day);
  }
}
