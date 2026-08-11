import { AiUsage } from '@/ai-usage/entities/ai-usage.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface KPIsOptions {
  filter?: {
    months?: number;
  };
}

export interface AIUsageOptions {
  filter?: {
    when?: {
      ge: Date;
      le: Date;
    };
    userId?: string;
  };
}

@Injectable()
export class AdministrativeOverviewService {
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

  public async getAIUsage(options?: AIUsageOptions) {
    const queryBuilder = this.dataSource
      .getRepository(AiUsage)
      .createQueryBuilder('usage')
      .select('COALESCE(SUM(usage.inputTokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(usage.outputTokens), 0)', 'outputTokens');

    if (options?.filter?.when) {
      queryBuilder.andWhere('usage.createdAt >= :startDate', { startDate: options.filter.when.ge });
      queryBuilder.andWhere('usage.createdAt <= :endDate', { endDate: options.filter.when.le });
    }

    if (options?.filter?.userId) {
      queryBuilder.andWhere('usage.userId = :userId', { userId: options.filter.userId });
    }

    const usageResult = await queryBuilder.getRawOne();

    return {
      inputTokens: usageResult ? Number(usageResult.inputTokens) : 0,
      outputTokens: usageResult ? Number(usageResult.outputTokens) : 0,
    };
  }
}
