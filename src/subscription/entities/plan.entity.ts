import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from './subscription.entity';

export enum PlanDurationInterval {
  Lifetime = 'lifetime',
  Yearly = 'yearly',
  Monthly = 'monthly',
}

export type PlanDuration = {
  interval: PlanDurationInterval;
  intervalCount: number;
};

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('float')
  price!: number;

  @Column({ nullable: true })
  trialPeriodDays?: number;

  @Column('jsonb')
  benefits!: string[];

  @Column('jsonb', {
    default: {
      interval: PlanDurationInterval.Monthly,
      intervalCount: 1,
    },
  })
  duration!: PlanDuration;

  @Column({ type: 'boolean', default: false })
  isPrivate!: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions?: Subscription[];

  activeSubscriptions: number = 0;
}
