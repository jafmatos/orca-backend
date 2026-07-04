import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@/user/entities/user.entity';

export enum KeyTypes {
  SignUp = 'sign-up',
  ResetPassword = 'reset-password',
  DeleteAccount = 'delete-account',
}

@Entity('user_keys')
export class UserKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: KeyTypes })
  type!: KeyTypes;

  @Column()
  otp!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'simple-json', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User, (user) => user.keys, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
