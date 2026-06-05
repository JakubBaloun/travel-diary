import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Day } from '../../days/entities/day.entity';
import { EntryType } from '../../common/enums/entry-type.enum';

@Entity()
@Index(['dayId', 'sortOrder'])
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dayId' })
  dayId: string;

  @Column({ type: 'enum', enum: EntryType })
  type: EntryType;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Day, (day) => day.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dayId' })
  day: Day;
}
