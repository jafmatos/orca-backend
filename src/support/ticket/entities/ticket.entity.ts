import { TicketStatuses } from '@/common/enums/ticket-statuses.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
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
}
