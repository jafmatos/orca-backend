import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface KPIsOptions {
  filter?: {
    months?: number;
  };
}

@Injectable()
export class AdminOverviewService {
  constructor(private readonly dataSource: DataSource) {}

  public async getKPIs(_options?: KPIsOptions) {
    const totalUsers = await this.dataSource.getRepository('User').count();

    const activeSubscriptions = await this.dataSource
      .getRepository('Subscription')
      .countBy({ status: 'active' });

    const mrrResult = await this.dataSource
      .createQueryBuilder()
      .from('subscription', 'subscription')
      .select('COALESCE(SUM(plan.price), 0)', 'expectedIncome')
      .where("subscription.status = 'active'")
      .leftJoin('subscription.plan', 'plan')
      .getRawOne();

    return {
      totalUsers,
      activeSubscriptions,
      mrr: mrrResult ? Number(mrrResult.expectedIncome) : 0,
    };
  }
}
