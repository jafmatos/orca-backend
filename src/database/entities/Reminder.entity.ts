import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Category } from "./Category.entity";
import { User } from "./User.entity";
import { EntryTypes } from "Src/types/EntryTypes";

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: false })
  createEntryAutomatically!: boolean;

  @Column({ type: "enum", enum: EntryTypes })
  type!: EntryTypes;

  @Column()
  description?: string;

  @Column("float", { scale: 2, nullable: true })
  amount?: number;

  @Column({ nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, (category) => category.entries, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "categoryId",
  })
  category?: Category | null;

  @Column({ nullable: false })
  userId?: string | null;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column()
  referenceDateTime!: Date;

  @Column("timestamp", { nullable: true })
  removedAt?: Date | null;
}
