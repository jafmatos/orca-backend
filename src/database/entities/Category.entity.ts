import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Entry } from "./Entry.entity";

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

  @OneToMany(() => Entry, (entry) => entry.category)
  entries?: Entry[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
