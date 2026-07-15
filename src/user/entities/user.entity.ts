import { Analysis } from '@/analysis/entities/analysis.entity';
import { UserKey } from '@/auth/entities/user-key.entity';
import { Category } from '@/category/entities/category.entity';
import { Limit } from '@/category/entities/limit.entity';
import { Entry } from '@/entry/entities/entry.entity';
import { PushSubscription } from '@/notifications/push-subscription/entities/push-subscription.entity';
import { Schedule } from '@/schedule/entities/schedule.entity';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { Ticket } from '@/support/ticket/entities/ticket.entity';
import { Avatar } from '@/user/entities/avatar.entity';
import { Exclude } from 'class-transformer';
import {
  AfterInsert,
  AfterLoad,
  AfterRecover,
  AfterRemove,
  AfterSoftRemove,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRoles {
  User = 'user',
  Admin = 'admin',
  SuperUser = 'super-user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  stripeId?: string;

  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.User })
  role!: UserRoles;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ type: 'boolean', default: false })
  isEmailConfirmed!: boolean;

  @Column({ type: 'boolean', default: false })
  isBetaTester!: boolean;

  @Column({ type: 'boolean', default: false })
  acceptsNotifications!: boolean;

  @OneToMany(
    () => PushSubscription,
    (pushSubscription) => pushSubscription.user,
    { cascade: ['insert', 'update'] },
  )
  pushSubscriptions?: PushSubscription[];

  @OneToMany(() => Category, (category) => category.user)
  categories?: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules?: Schedule[];

  @OneToMany(() => Limit, (limit) => limit.userId)
  limits?: Limit[];

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets?: Ticket[];

  @Exclude()
  @Column()
  password!: string;

  @Column('int', { default: 1 })
  salaryDay!: number;

  @Column({ type: 'varchar', nullable: true })
  financialGoal?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedTermsAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoggedIn!: Date | null;

  @OneToOne(() => Avatar, (avatar) => avatar.user, { eager: true })
  avatar?: Avatar;

  @OneToMany(() => UserKey, (key) => key.user)
  keys?: UserKey[];

  @OneToOne(() => Subscription, (subscription) => subscription.user, {
    eager: true,
  })
  subscription?: Subscription;

  @OneToMany(() => Analysis, (analysis) => analysis.user)
  analyses: Analysis[];

  balance?: number;
  currentCycle!: {
    start: Date;
    end: Date;
  };

  @AfterInsert()
  @AfterLoad()
  @AfterRecover()
  @AfterRemove()
  @AfterSoftRemove()
  @AfterUpdate()
  setCurrentCycle() {
    const now = new Date();
    const salaryDayOnThisMonth = new Date();

    salaryDayOnThisMonth.setDate(this.salaryDay);
    salaryDayOnThisMonth.setHours(0, 0, 0, 0);

    if (salaryDayOnThisMonth < now) {
      const start = salaryDayOnThisMonth;
      const end = new Date(start);

      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(-1);

      this.currentCycle = {
        start,
        end,
      };

      return;
    }

    const start = new Date(salaryDayOnThisMonth);
    const end = new Date(salaryDayOnThisMonth);

    start.setMonth(start.getMonth() - 1);
    end.setMilliseconds(-1);

    this.currentCycle = {
      start,
      end,
    };
  }
}
