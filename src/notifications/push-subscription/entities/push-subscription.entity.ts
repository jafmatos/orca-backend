import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/user/entities/user.entity';

export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export enum PushSubscriptionProvider {
  Webpush = 'webpush',
  Expo = 'expo',
}

@Entity('push_subscription')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    enum: PushSubscriptionProvider,
    default: PushSubscriptionProvider.Webpush,
  })
  provider!: PushSubscriptionProvider;

  @Column({ nullable: true })
  platform?: string;

  @Column({ unique: true, nullable: true })
  endpoint?: string;

  @Column({ type: 'jsonb', nullable: true })
  keys?: IPushSubscription['keys'];

  @Column({ unique: true, nullable: true })
  expoPushToken?: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
