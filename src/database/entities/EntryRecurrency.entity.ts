import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Entry } from "./Entry.entity";
import { User } from "./User.entity";

export enum RecurrencyTypes {
  Monthly = "monthly",
  Weekly = "weekly",
  Daily = "daily",
}

export enum RecurrencyActions {
  Create = "create",
  Notify = "notify",
}

@Entity()
export class EntryRecurrency {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: RecurrencyTypes })
  type!: RecurrencyTypes;

  @Column({ type: "enum", enum: RecurrencyActions })
  action!: RecurrencyActions;

  @OneToMany(() => Entry, (entry) => entry.recurrency)
  entries?: Entry[];

  @ManyToOne(() => User, (user) => user.recurrencies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;
}
