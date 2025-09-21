import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
