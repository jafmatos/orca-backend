import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Avatar } from "./Avatar.entity";
import { Category } from "./Category.entity";
import { Entry } from "./Entry.entity";
import { Subscription } from "./Subscription.entity";
import { UserKey } from "./UserKey.entity";

export enum UserRoles {
  User = "user",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  stripeId?: string;

  @Column({ type: "enum", enum: UserRoles, default: UserRoles.User })
  role!: UserRoles;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ type: "boolean", default: false })
  isEmailConfirmed!: boolean;

  @Column()
  password!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodGe!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodLe!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  lastLoggedIn!: Date | null;

  @OneToMany(() => Category, (category) => category.user)
  categories?: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  @OneToOne(() => Avatar, (avatar) => avatar.user, { eager: true })
  avatar?: Avatar;

  @OneToOne(() => Subscription, (subscription) => subscription.user, { eager: true })
  subscription?: Subscription;

  @OneToMany(() => UserKey, (key) => key.user)
  keys?: UserKey[];

  balance?: number;
}
