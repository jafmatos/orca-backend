import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Entry } from "./Entry.entity";
import { User } from "./User.entity";
import { CategoryTypes } from "Src/types/CategoryTypes";
import { Limit } from "./Limit.entity";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("enum", { enum: CategoryTypes, default: CategoryTypes.Expense })
  type!: CategoryTypes;

  @Column("boolean", { default: true })
  isActive!: boolean;

  @Column()
  name!: string;

  @Column({ nullable: false })
  userId?: string | null;

  @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @OneToMany(() => Entry, (entry) => entry.category)
  entries?: Entry[];

  @OneToOne(() => Limit, (limit) => limit.category, { eager: true, cascade: true })
  limit?: Limit;

  @Column("timestamp", { nullable: true })
  removedAt?: Date | null;

  spent?: number;
}
