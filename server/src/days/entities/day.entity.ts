import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Entry } from '../../entries/entities/entry.entity';

@Entity()
@Unique(['tripId', 'dayNumber'])
export class Day {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tripId' })
  tripId: string;

  @Column({ type: 'int' })
  dayNumber: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @ManyToOne(() => Trip, (trip) => trip.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @OneToMany(() => Entry, (entry) => entry.day, { cascade: true })
  entries: Entry[];
}
