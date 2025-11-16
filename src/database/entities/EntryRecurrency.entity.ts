import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Entry } from "./Entry.entity";

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

  @Column({ type: "enum", enum: RecurrencyTypes })
  type!: RecurrencyTypes;

  @Column({ type: "enum", enum: RecurrencyActions })
  action!: RecurrencyActions;

  @OneToMany(() => Entry, (entry) => entry.recurrency)
  @JoinColumn()
  entries?: Entry[];
}
