import { dataSource } from "Src/database/data-source";

export type FindOverviewWhere = {
  userId: string;
  when?: {
    ge: Date;
    le: Date;
  };
};

export class OverviewService {
  public static async find(where: FindOverviewWhere) {
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
}
