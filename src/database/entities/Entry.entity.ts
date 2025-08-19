import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";
import { EntryTypes } from "Src/types/EntryTypes";

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
}
