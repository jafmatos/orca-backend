import {
	Column, Entity,
	JoinColumn,
	ManyToOne, PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./User.entity";

export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Entity()
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  endpoint!: string;

  @Column({ type: "jsonb", nullable: false })
  keys!: IPushSubscription["keys"];

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, { onDelete: "CASCADE", onUpdate: "CASCADE", orphanedRowAction: "delete" })
  @JoinColumn({ name: "userId" })
  user?: User;
}
