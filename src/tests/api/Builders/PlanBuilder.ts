import { Plan } from "../Models";

export class PlanBuilder {
  protected id!: Plan["id"];
  protected name!: Plan["name"];
  protected price!: Plan["price"];
  protected trialPeriodDays!: Plan["trialPeriodDays"];
  protected benefits!: Plan["benefits"];

  private constructor() {}

  public static one() {
    return new PlanBuilder();
  }

  public setId(id: PlanBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setName(name: PlanBuilder["name"]) {
    this.name = name;

    return this;
  }

  public setPrice(price: PlanBuilder["price"]) {
    this.price = price;

    return this;
  }

  public setTrialPeriodDays(trialPeriodDays: PlanBuilder["trialPeriodDays"]) {
    this.trialPeriodDays = trialPeriodDays;

    return this;
  }

  public setBenefits(benefits: PlanBuilder["benefits"]) {
    this.benefits = benefits;

    return this;
  }

  public build() {
    return new Plan(this.id, this.name, this.price, this.trialPeriodDays, this.benefits);
  }
}
