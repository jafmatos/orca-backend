import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";

@Entity()
export class Limit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("float", { scale: 2 })
  amount!: number;

  @Column()
  userId!: string;

  @Column()
  categoryId!: string;

  @OneToOne(() => Category, (category) => category.limit, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  category?: Category;
}
