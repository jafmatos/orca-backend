import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category.entity";
import { Entry } from "./Entry.entity";
import { Avatar } from "./Avatar.entity";

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

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodGe!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodLe!: Date;

  @OneToMany(() => Category, (category) => category.user)
  categories?: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  @OneToOne(() => Avatar, (avatar) => avatar.user, { eager: true })
  avatar?: Avatar;

  balance?: number;
}
