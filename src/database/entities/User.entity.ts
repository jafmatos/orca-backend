import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";
import { Entry } from "./Entry.entity";

export enum UserRoles {
  User = "user",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.User })
  role!: UserRoles;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({ type: "timestamp" })
  periodGe!: Date;

  @Column({ type: "timestamp" })
  periodLe!: Date;

  @OneToMany(() => Category, (category) => category.user)
  categories?: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  balance?: number;
}
