import { Limit } from '@/category/entities/limit.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { Entry } from '@/entry/entities/entry.entity';
import { User } from '@/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: EntryTypes, default: EntryTypes.Expense })
  type!: EntryTypes;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column()
  name!: string;

  @Column({ nullable: false, type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => Entry, (entry) => entry.category)
  entries?: Entry[];

  @OneToOne(() => Limit, (limit) => limit.category, {
    eager: true,
    cascade: true,
    nullable: true,
  })
  limit?: Limit | null;

  spent?: number; // Virtual property, used in API responses
}
