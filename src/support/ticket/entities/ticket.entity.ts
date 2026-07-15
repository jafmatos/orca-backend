import { TicketStatuses } from '@/common/enums/ticket-statuses.enum';
import { User } from '@/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ nullable: false, length: 60 })
  subject!: string;

  @Column({ nullable: false, length: 150 })
  description!: string;

  @Column({ type: 'enum', enum: TicketStatuses, default: TicketStatuses.OPEN })
  status!: TicketStatuses;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => User, (user) => user.tickets, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user!: User;
}
