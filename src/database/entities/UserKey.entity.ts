import { KeyTypes } from "Src/types/KeyTypes";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";

@Entity("user_keys")
export class UserKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: KeyTypes })
  type!: KeyTypes;

  @Column()
  otp!: string;

  @Column()
  userId!: string;

  @Column({ type: "timestamp", nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User, (user) => user.keys, { onDelete: "CASCADE", orphanedRowAction: "delete" })
  @JoinColumn({ name: "userId" })
  user?: User;
}
