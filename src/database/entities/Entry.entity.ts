import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";
import { EntryTypes } from "Src/types/EntryTypes";
import { User } from "./User.entity";

@Entity()
export class Entry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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

  @Column({ nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, (category) => category.entries, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    cascade: ["insert"],
    eager: true,
  })
  @JoinColumn({
    name: "categoryId",
  })
  category?: Category | null;

  @Column({ nullable: false })
  userId!: string;

  @ManyToOne(() => User, (user) => user.entries, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "userId",
  })
  user?: User;
}
