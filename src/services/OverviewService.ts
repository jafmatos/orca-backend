import { dataSource } from "Src/database/data-source";

export type StatusOverviewWhere = {
  userId: string;
  when?: {
    ge: Date;
    le: Date;
  };
};

export type HistoryOverviewWhere = {
  userId: string;
  months: number;
};

export class OverviewService {
  public static async status(where: StatusOverviewWhere) {
    const queryBuilder = dataSource
      .createQueryBuilder()
      .select(
        `
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as totalExpense, 
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'income' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as totalIncome, 
				COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as balance
				`
      )
      .from("entry", "entry")
      .where("entry.userId = :userId AND (DATE(entry.when) BETWEEN :ge::date AND :le::date)", {
        userId: where.userId,
        ge: where.when?.ge,
        le: where.when?.le,
      });

    const result = await queryBuilder.getRawOne();

    return result;
  }

  public static async history(options: HistoryOverviewWhere) {
    const history = await dataSource
      .createQueryBuilder()
      .select(
        "TO_CHAR(months.month, 'mm/yy') AS month, COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as balance,COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as totalExpense, COALESCE(ROUND(SUM(CASE WHEN entry.type = 'income' THEN entry.amount ELSE 0 END)::numeric, 2), 0)::double precision as totalIncome"
      )
      .from(
        `(SELECT generate_series(
						DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * (:months - 1),
						DATE_TRUNC('month', CURRENT_DATE),
						'1 month'
      		) as month)`,
        "months"
      )
      .setParameter("months", options.months)
      .leftJoin("entry", "entry", "TO_CHAR(months.month, 'MM/YY') = TO_CHAR(entry.when, 'MM/YY') AND entry.userId = :userId", {
        userId: options.userId,
      })
      .groupBy("months.month")
      .orderBy("months.month")
      .getRawMany();

    return history;
  }
}
