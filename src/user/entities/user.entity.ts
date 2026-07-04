import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToOne, OneToMany } from "typeorm";
import { Avatar } from '@/user/entities/avatar.entity';
import { UserKey } from '@/auth/entities/user-key.entity';

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

  @Column({ type: "varchar", nullable: true })
  financialGoal?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  acceptedTermsAt?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  lastLoggedIn!: Date | null;

  balance?: number;

  @OneToOne(() => Avatar, (avatar) => avatar.user, { eager: true })
  avatar?: Avatar;

  @OneToMany(() => UserKey, (key) => key.user)
  keys?: UserKey[];
}
