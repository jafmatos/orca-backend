import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Entry } from '@/entry/entities/entry.entity';
import { Schedule } from './schedule.entity';

@Entity('schedule_occurrence')
export class ScheduleOccurrence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: false })
  scheduleId!: string;

  @Column('uuid', { nullable: false })
  entryId!: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.occurrences, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'scheduleId' })
  schedule!: Schedule;

  @OneToOne(() => Entry, (entry) => entry.occurrence, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'entryId' })
  entry!: Entry;

  @CreateDateColumn()
  createdAt!: Date;
}
