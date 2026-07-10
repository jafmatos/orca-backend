import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Entry } from '@/entry/entities/entry.entity';
import { Category } from '@/category/entities/category.entity';
import { User } from '@/user/entities/user.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ScheduleOccurrence } from './schedule-occurrence.entity';

export enum ScheduleFrequency {
  Monthly = 'monthly',
  Weekly = 'weekly',
}

export enum ScheduleStatus {
  Done = 'done',
  Pending = 'pending',
  Overdue = 'overdue',
}

export type ScheduleCycle = {
  expectedDate: Date;
  status: ScheduleStatus;
  occurrence?: ScheduleOccurrence;
};

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: false })
  userId!: string;

  @Column('uuid', { nullable: true })
  categoryId?: string | null;

  @Column({ type: 'enum', enum: EntryTypes })
  type!: EntryTypes;

  @Column('float', { scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Category, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @ManyToOne(() => User, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('int', { nullable: true })
  dayOfMonth?: number;

  @Column('int', { nullable: true })
  dayOfWeek?: number;

  @Column('varchar', { length: 5 })
  time!: string;

  @Column('varchar', { length: 50 })
  timezone!: string;

  @Column('enum', {
    enum: ScheduleFrequency,
    default: ScheduleFrequency.Monthly,
  })
  frequency!: ScheduleFrequency;

  @OneToMany(() => ScheduleOccurrence, (occurrence) => occurrence.schedule)
  occurrences?: ScheduleOccurrence[];

  getCycles(): ScheduleCycle[] {
    if (!this.user) return [];

    if (!this.user.currentCycle && typeof this.user.setCurrentCycle === 'function') {
      this.user.setCurrentCycle();
    }

    const currentCycleStart = new Date(this.user.currentCycle.start);
    const currentCycleEnd = new Date(this.user.currentCycle.end);
    const now = new Date();
    const expectedDates: Date[] = [];

    if (this.frequency === ScheduleFrequency.Monthly) {
      const referenceDay = this.dayOfMonth!;
      const current = new Date(currentCycleStart);

      current.setDate(referenceDay);
      current.setHours(0, 0, 0, 0);

      if (current < currentCycleStart) {
        current.setMonth(current.getMonth() + 1);
      }

      while (current <= currentCycleEnd) {
        expectedDates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    }

    if (this.frequency === ScheduleFrequency.Weekly) {
      const referenceDow = this.dayOfWeek!;
      const current = new Date(currentCycleStart);

      current.setHours(0, 0, 0, 0);

      const daysUntilDow = (referenceDow - current.getDay() + 7) % 7;

      current.setDate(current.getDate() + daysUntilDow);

      while (current <= currentCycleEnd) {
        expectedDates.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    }

    const cycles: ScheduleCycle[] = expectedDates.map((expectedDate) => ({
      expectedDate,
      status:
        now > expectedDate ? ScheduleStatus.Overdue : ScheduleStatus.Pending,
    }));

    const sortedOccurrences = [...(this.occurrences || [])].sort(
      (a, b) => a.entry.when.getTime() - b.entry.when.getTime(),
    );

    const availableCycles = [...cycles];

    for (const occurrence of sortedOccurrences) {
      if (availableCycles.length === 0) break;

      const occTime = occurrence.entry.when.getTime();

      let closestCycleIndex = 0;
      let minDiff = Math.abs(
        availableCycles[0].expectedDate.getTime() - occTime,
      );

      for (let i = 1; i < availableCycles.length; i++) {
        const diff = Math.abs(
          availableCycles[i].expectedDate.getTime() - occTime,
        );
        if (diff < minDiff) {
          minDiff = diff;
          closestCycleIndex = i;
        }
      }

      const closestCycle = availableCycles[closestCycleIndex];

      closestCycle.status = ScheduleStatus.Done;
      closestCycle.occurrence = occurrence;

      availableCycles.splice(closestCycleIndex, 1);
    }

    return cycles;
  }

  getCron() {
    const [hoursStr, minutesStr] = this.time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (this.frequency === ScheduleFrequency.Monthly) {
      return `${minutes} ${hours} ${this.dayOfMonth} * *`;
    }

    return `${minutes} ${hours} * * ${this.dayOfWeek}`;
  }

  getCronMinusOneDay() {
    const [hoursStr, minutesStr] = this.time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (this.frequency === ScheduleFrequency.Monthly) {
      let date = this.dayOfMonth! - 1;
      if (date < 1) date = 28;

      return `${minutes} ${hours} ${date} * *`;
    }

    const previousDayOfWeek =
      this.dayOfWeek !== undefined && this.dayOfWeek > 0
        ? this.dayOfWeek - 1
        : 6;
    
    return `${minutes} ${hours} * * ${previousDayOfWeek}`;
  }

  toJSON() {
    return {
      ...this,
      cycles: this.getCycles(),
    };
  }
}
