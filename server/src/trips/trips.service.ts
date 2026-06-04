import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  async findAll(): Promise<Trip[]> {
    return this.tripRepository.find({
      select: {
        id: true,
        title: true,
        slug: true,
        coverPhotoUrl: true,
        startDate: true,
        endDate: true,
      },
      order: { startDate: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { slug },
      relations: { days: true },
      order: { days: { dayNumber: 'ASC' } },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async create(dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepository.create(dto);
    return this.tripRepository.save(trip);
  }

  async update(id: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.tripRepository.preload({ id, ...dto });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return this.tripRepository.save(trip);
  }

  async remove(id: string): Promise<void> {
    const trip = await this.tripRepository.findOneBy({ id });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    await this.tripRepository.remove(trip);
  }
}
