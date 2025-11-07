export class Plan {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public trialPeriodDays: number | undefined,
    public benefits: string[]
  ) {}
}
