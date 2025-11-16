import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";
import { EntryTypes } from "Src/types/EntryTypes";
import { User } from "./User.entity";
import { EntryRecurrency } from "./EntryRecurrency.entity";

@Entity()
export class Entry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: false })
  userId!: string;

  @Column({ nullable: true })
  categoryId?: string | null;

  @Column({ nullable: true })
  recurrencyId?: string | null;

  @Column({ type: "enum", enum: EntryTypes })
  type!: EntryTypes;

  @Column("float", { scale: 2 })
  amount!: number;

  @Column()
  description?: string;

  @Column({
    nullable: true,
  })
  when?: Date;

  @ManyToOne(() => EntryRecurrency, (recurrency) => recurrency.entries, {
    eager: true,
    cascade: ["insert", "recover", "remove", "soft-remove"],
  })
  @JoinColumn({
    name: "recurrencyId",
  })
  recurrency?: EntryRecurrency | null;

  @ManyToOne(() => Category, (category) => category.entries, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({
    name: "categoryId",
  })
  category?: Category | null;

  @ManyToOne(() => User, (user) => user.entries, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user?: User;

  @Column("timestamp", { nullable: true })
  removedAt?: Date | null;
}
