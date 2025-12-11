import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type PlanDurationFrequency = "yearly" | "monthly";

export enum PlanDurationInterval {
  Yearly = "yearly",
  Monthly = "monthly",
}

export type PlanDuration = {
  interval: PlanDurationInterval;
  intervalCount: number;
};

@Entity()
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column("float")
  price!: number;

  @Column({ nullable: true })
  trialPeriodDays?: number;

  @Column("simple-json")
  benefits!: string[];

  @Column("simple-json", {
    default: {
      interval: PlanDurationInterval.Monthly,
      intervalCount: 1,
    },
  })
  duration!: PlanDuration;
}
