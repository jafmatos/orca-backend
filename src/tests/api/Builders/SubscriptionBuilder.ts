import { Subscription, SubscriptionStatuses, User, Plan } from "../Models";

export class SubscriptionBuilder {
  protected id!: Subscription["id"];
  protected stripeId!: Subscription["stripeId"];
  protected userId!: Subscription["userId"];
  protected planId!: Subscription["planId"];
  protected trialStart!: Subscription["trialStart"];
  protected trialEnd!: Subscription["trialEnd"];
  protected status!: Subscription["status"];
  protected user!: Subscription["user"];
  protected plan!: Subscription["plan"];
  protected createdAt!: Subscription["createdAt"];
  protected traducedStatus!: Subscription["traducedStatus"];
  protected isValid!: Subscription["isValid"];

  private constructor() {}

  public static one() {
    return new SubscriptionBuilder();
  }

  public setId(id: SubscriptionBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setStripeId(stripeId: SubscriptionBuilder["stripeId"]) {
    this.stripeId = stripeId;

    return this;
  }

  public setUserId(userId: SubscriptionBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setPlanId(planId: SubscriptionBuilder["planId"]) {
    this.planId = planId;

    return this;
  }

  public setTrialStart(trialStart: SubscriptionBuilder["trialStart"]) {
    this.trialStart = trialStart;

    return this;
  }

  public setTrialEnd(trialEnd: SubscriptionBuilder["trialEnd"]) {
    this.trialEnd = trialEnd;

    return this;
  }

  public setStatus(status: SubscriptionBuilder["status"]) {
    this.status = status;

    return this;
  }

  public setUser(user: SubscriptionBuilder["user"]) {
    this.user = user;

    return this;
  }

  public setPlan(plan: SubscriptionBuilder["plan"]) {
    this.plan = plan;

    return this;
  }

  public setCreatedAt(createdAt: SubscriptionBuilder["createdAt"]) {
    this.createdAt = createdAt;

    return this;
  }

  public setTraducedStatus(traducedStatus: SubscriptionBuilder["traducedStatus"]) {
    this.traducedStatus = traducedStatus;

    return this;
  }

  public setIsValid(isValid: SubscriptionBuilder["isValid"]) {
    this.isValid = isValid;

    return this;
  }

  public build() {
    return new Subscription(
      this.id,
      this.stripeId,
      this.userId,
      this.planId,
      this.trialStart,
      this.trialEnd,
      this.status,
      this.user,
      this.plan,
      this.createdAt,
      this.traducedStatus,
      this.isValid
    );
  }
}