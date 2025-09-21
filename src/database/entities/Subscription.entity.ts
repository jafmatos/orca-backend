import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";
import { Plan } from "./Plan.entity";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  stripeId!: string;

  @Column()
  userId!: string;

  @Column()
  planId!: string;

  @Column({ nullable: true, type: "timestamp" })
  trialStart?: Date | null;

  @Column({ nullable: true, type: "timestamp" })
  trialEnd?: Date | null;

  @Column({ type: "enum", enum: SubscriptionStatuses })
  status!: SubscriptionStatuses;

  @OneToOne(() => User, (user) => user.subscription, { onDelete: "CASCADE", onUpdate: "CASCADE", orphanedRowAction: "delete" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @ManyToOne(() => Plan, { onDelete: "CASCADE", onUpdate: "CASCADE", eager: true })
  @JoinColumn({ name: "planId" })
  plan?: Plan;

  @CreateDateColumn()
  createdAt!: Date;
}
