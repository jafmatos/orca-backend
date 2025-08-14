import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";

@Entity()
export class Expense {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("float", { scale: 2 })
  amount!: number;

  @Column()
  description?: string;

  @Column({
    nullable: true,
  })
  when?: Date;

  @ManyToOne(() => Category, (category) => category.expenses, {
    onUpdate: "CASCADE",
		onDelete: "CASCADE",
    cascade: ["insert"],
    eager: true,
  })
  @JoinColumn()
  category?: Category;
}
