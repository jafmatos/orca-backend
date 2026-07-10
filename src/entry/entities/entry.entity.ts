import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/user/entities/user.entity';
import { Category } from '@/category/entities/category.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ScheduleOccurrence } from '@/schedule/entities/schedule-occurrence.entity';

@Entity('entry')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @Column({ type: 'enum', enum: EntryTypes })
  type!: EntryTypes;

  @Column({ type: 'float', scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  when!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Category, (category) => category.entries, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @ManyToOne(() => User, (user) => user.entries, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToOne(() => ScheduleOccurrence, (occurrence) => occurrence.entry, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  occurrence?: ScheduleOccurrence;
}
