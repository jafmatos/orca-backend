import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Avatar } from "./Avatar.entity";
import { Category } from "./Category.entity";
import { Entry } from "./Entry.entity";
import { Subscription } from "./Subscription.entity";
import { UserKey } from "./UserKey.entity";
import { Reminder } from "./Reminder.entity";
import { PushSubscription } from "./PushSubscription.entity";

export enum UserRoles {
  User = "user",
  Admin = "admin",
  SuperUser = "super-user",
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

  @Column({ type: "boolean", default: false })
  acceptsNotifications!: boolean;

  @OneToMany(() => PushSubscription, (pushSubscription) => pushSubscription.user, { cascade: ["insert", "update"] })
  pushSubscriptions?: PushSubscription[];

  @Column()
  password!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodGe!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  periodLe!: Date;

  @Column({ type: "boolean", default: false })
  periodManuallyAdjusted!: boolean;

  @Column("int", { default: 1 })
  periodReferenceDay!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  acceptedTermsAt?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  lastLoggedIn!: Date | null;

  @OneToMany(() => Category, (category) => category.user)
  categories?: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders?: Reminder[];

  @OneToOne(() => Avatar, (avatar) => avatar.user, { eager: true })
  avatar?: Avatar;

  @OneToOne(() => Subscription, (subscription) => subscription.user, { eager: true, cascade: ["insert", "update"] })
  subscription?: Subscription;

  @OneToMany(() => UserKey, (key) => key.user)
  keys?: UserKey[];

  balance?: number;
}
