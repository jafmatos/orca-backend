import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '@/category/entities/category.entity';

@Entity('limit')
export class Limit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'float', scale: 2 })
  amount!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId!: string | null;

  @OneToOne(() => Category, (category) => category.limit, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  spent?: number; // Virtual property
}
