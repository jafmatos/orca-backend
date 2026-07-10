import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type StatusOverviewWhere = {
  userId: string;
  when?: {
    ge: Date;
    le: Date;
  };
};

export type HistoryOverviewWhere = {
  userId: string;
  months?: number;
};

@Injectable()
export class OverviewService {
  constructor(private readonly dataSource: DataSource) {}

  async status(where: StatusOverviewWhere) {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(
        `
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as "totalExpense", 
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'income' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as "totalIncome", 
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as "balance"
				`,
      )
      .from('entry', 'entry')
      .where('entry."userId" = :userId AND (entry.when BETWEEN :ge AND :le)', {
        userId: where.userId,
        ge: where.when?.ge,
        le: where.when?.le,
      });

    const limitsQueryBuilder = this.dataSource
      .createQueryBuilder()
      .select(
        `
				COALESCE(ROUND(SUM(limit_entity.amount)::numeric, 2), 0)::double precision as "totalLimits"
				`,
      )
      .from('limit', 'limit_entity')
      .where('limit_entity."userId" = :userId', {
        userId: where.userId,
      });

    const result = await queryBuilder.getRawOne();
    const limitsResult = await limitsQueryBuilder.getRawOne();
    const schedulesResult = { totalScheduled: 0 };

    return { ...result, ...limitsResult, ...schedulesResult };
  }

  async history(options: HistoryOverviewWhere) {
    const history = await this.dataSource
      .createQueryBuilder()
      .select(
        `TO_CHAR(months.month, 'mm/yy') AS month, COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as "balance", COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as "totalExpense", COALESCE(ROUND(SUM(CASE WHEN entry.type = 'income' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as "totalIncome"`,
      )
      .from(
        `(
          SELECT generate_series(
            COALESCE(
              DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * (:months::integer - 1),
              (SELECT COALESCE(DATE_TRUNC('month', MIN(e.when)), DATE_TRUNC('month', CURRENT_DATE)) FROM entry e WHERE e."userId" = :userId)
            ),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'
          ) AS month
        )`,
        'months',
      )
      .setParameter('userId', options.userId)
      .setParameter(
        'months',
        options.months !== undefined ? options.months : null,
      )
      .leftJoin(
        'entry',
        'entry',
        `TO_CHAR(months.month, 'MM/YY') = TO_CHAR(entry.when, 'MM/YY') AND entry."userId" = :userId`,
        {
          userId: options.userId,
        },
      )
      .groupBy('months.month')
      .orderBy('months.month')
      .getRawMany();

    return history;
  }
}
