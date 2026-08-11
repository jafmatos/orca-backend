import { User } from '@/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AiUsageType {
  Analysis = 'analysis',
  Assistant = 'assistant',
  SmartExtract = 'smart-extract',
}

@Entity('ai_usage')
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: AiUsageType })
  type!: AiUsageType;

  @Column({ type: 'int' })
  inputTokens!: number;

  @Column({ type: 'int' })
  outputTokens!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.aiUsages, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
