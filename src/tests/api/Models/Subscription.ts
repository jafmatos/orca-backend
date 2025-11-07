import { Plan } from "./Plan";
import { User } from "./User";

export enum SubscriptionStatuses {
  Trialing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Canceled = "canceled",
  Unpaid = "unpaid",
  Paused = "paused",
}

export class Subscription {
  constructor(
    public id: string,
    public stripeId: string,
    public userId: string,
    public planId: string,
    public trialStart: Date | null,
    public trialEnd: Date | null,
    public status: SubscriptionStatuses,
    public user: User | undefined,
    public plan: Plan,
    public createdAt: Date | null,
    public traducedStatus: string,
    public isValid: boolean
  ) {}
}
