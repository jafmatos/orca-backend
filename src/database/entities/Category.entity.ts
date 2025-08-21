import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Entry } from "./Entry.entity";
import { User } from "./User.entity";

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

  @Column({ nullable: false })
  userId?: string | null;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @OneToMany(() => Entry, (entry) => entry.category)
  entries?: Entry[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
