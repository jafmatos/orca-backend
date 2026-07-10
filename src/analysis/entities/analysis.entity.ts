import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@/user/entities/user.entity';

@Entity('analysis')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  openaiId: string;

  @Column()
  userId: string;

  @Column('int', { nullable: true, default: null })
  inputTokens?: number;

  @Column('int', { nullable: true, default: null })
  outputTokens?: number;

  @Column({ type: 'jsonb' })
  output: {
    diagnostic: string;
    issues: { title: string; effect: string }[];
    actions: { title: string; effect: string }[];
    expectation: string;
  };

  @ManyToOne(() => User, (user) => user.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
