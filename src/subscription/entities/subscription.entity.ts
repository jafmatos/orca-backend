import {
  AfterInsert,
  AfterLoad,
  AfterRecover,
  AfterRemove,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/user/entities/user.entity';
import { Plan } from './plan.entity';
import { SubscriptionStatuses } from '../enums/subscription-status.enum';

@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  stripeId?: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  planId!: string;

  @Column({ nullable: true, type: 'timestamp' })
  trialStart?: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  trialEnd?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date | null;

  @Column({ type: 'enum', enum: SubscriptionStatuses })
  status!: SubscriptionStatuses;

  @OneToOne(() => User, (user) => user.subscription, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Plan, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'planId' })
  plan?: Plan;

  @CreateDateColumn()
  createdAt!: Date;

  traducedStatus!: string;
  isActive!: boolean;

  @AfterInsert()
  @AfterLoad()
  @AfterRecover()
  @AfterRemove()
  @AfterUpdate()
  setTraducedStatus() {
    const map = new Map<SubscriptionStatuses, string>([
      [SubscriptionStatuses.Active, 'Ativa'],
      [SubscriptionStatuses.Canceled, 'Cancelada'],
      [SubscriptionStatuses.PastDue, 'Pagamento em atraso'],
      [SubscriptionStatuses.Paused, 'Pausada'],
      [SubscriptionStatuses.Trialing, 'Em teste'],
      [SubscriptionStatuses.Unpaid, 'Pagamento pendente'],
    ]);

    this.traducedStatus = map.get(this.status)!;
  }

  @AfterInsert()
  @AfterLoad()
  @AfterRecover()
  @AfterRemove()
  @AfterUpdate()
  setIsActive() {
    this.isActive = [
      SubscriptionStatuses.Trialing,
      SubscriptionStatuses.Active,
      SubscriptionStatuses.PastDue,
    ].includes(this.status);
  }
}
