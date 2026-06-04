import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from './entities/entry.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
  ) {}

  async create(dayId: string, dto: CreateEntryDto): Promise<Entry> {
    const entry = this.entryRepository.create({ ...dto, dayId });
    return this.entryRepository.save(entry);
  }

  async update(id: string, dto: UpdateEntryDto): Promise<Entry> {
    const entry = await this.entryRepository.preload({ id, ...dto });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return this.entryRepository.save(entry);
  }

  async remove(id: string): Promise<Entry> {
    const entry = await this.entryRepository.findOneBy({ id });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return this.entryRepository.remove(entry);
  }
}
