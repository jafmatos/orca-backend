import { Column, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Expense } from "./Expense";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("boolean", { default: true })
  isActive!: boolean;

  @Column()
  name!: string;

  @Column("float", { nullable: true, scale: 2 })
  mark?: number;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses?: Expense[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
