import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category";
import { Expense } from "Src/database/entities/Expense";
import { DeepPartial, FindOptionsOrder, FindOptionsWhere } from "typeorm";

type ListOptions = {
  order?: {
    entity?: string;
    column: string;
    mode: "ASC" | "DESC";
  };
  filter?: {
    text?: string;
    category?: string;
    when?: {
      ge?: string;
      le?: string;
    };
  };
  pagination: {
    skip: number;
    take: number;
  };
};

type SumUpOptions = {
  order?: {
    column?: string;
    mode?: "ASC" | "DESC";
  };
  filter?: {
    text?: string;
    category?: string;
    when?: {
      ge?: string;
      le?: string;
    };
  };
};

export class ExpenseService {
  private static readonly expenseRepository = dataSource.getRepository(Expense);

  public static async list(options?: ListOptions) {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder("expense")
      .leftJoinAndSelect("expense.category", "category")
      .where(
        "expense.id IN (SELECT expense.id FROM expense LEFT JOIN category ON expense.categoryId = category.id WHERE category.deletedAt IS NULL)"
      );

    if (options?.filter?.category) queryBuilder.andWhere("category.id = :category", { category: options.filter!.category! });
    if (options?.filter?.text)
      queryBuilder.andWhere(
        "(category.name LIKE :text OR expense.description LIKE :text OR REPLACE(FORMAT(expense.amount, 2), '.', ',') LIKE :text)",
        { text: `%${options.filter!.text!}%` }
      );
    if (options?.filter?.when)
      queryBuilder.andWhere("(DATE(expense.when) BETWEEN DATE(:ge) AND DATE(:le))", {
        ge: options?.filter.when.ge || new Date(new Date().getTime() - 100 * 365 * 24 * 60 * 60 * 1000),
        le: options?.filter.when.le || new Date(new Date().getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
      });

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.entity || "expense"}.${options.order.column}`, options.order.mode || "DESC");
    }

    if (options?.pagination) {
      queryBuilder.skip(options.pagination.skip);
      queryBuilder.take(options.pagination.take);
    }

    return await queryBuilder.getManyAndCount();
  }

  public static async sumUp(options?: SumUpOptions) {
    const queryBuilder = dataSource
      .createQueryBuilder(Category, "category")
      .select("category.name as category, category.mark as mark, ROUND(SUM(expense.amount), 2) as spent")
      .leftJoin("expense", "expense", "category.id = expense.categoryId")
      .where("category.deletedAt IS NULL")
      .groupBy("category.name");

    if (options?.filter?.category) queryBuilder.andWhere("category.id = :category", { category: options.filter!.category! });
    if (options?.filter?.text)
      queryBuilder.andWhere(
        "(category.name LIKE :text OR expense.description LIKE :text OR REPLACE(FORMAT(expense.amount, 2), '.', ',') LIKE :text)",
        { text: `%${options.filter!.text!}%` }
      );
    if (options?.filter?.when)
      queryBuilder.andWhere("(DATE(expense.when) BETWEEN DATE(:ge) AND DATE(:le))", {
        ge: options?.filter.when.ge || new Date("0000-01-01T00:00:00.000Z"),
        le: options?.filter.when.le || new Date(),
      });

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.column}`, options.order.mode || "DESC");
    } else {
      queryBuilder.orderBy("category.name", "ASC");
    }

    const sumUp = await queryBuilder.getRawMany();

    return { data: sumUp };
  }

  public static async findById(id: Expense["id"]) {
    const expense = await this.expenseRepository.findOneBy({
      id,
    });

    return expense;
  }

  public static async exists(id: Expense["id"]) {
    const exists = await this.expenseRepository.existsBy({
      id,
    });

    return exists;
  }

  public static async create(data: DeepPartial<Expense>) {
    const expense = await this.expenseRepository.save(this.expenseRepository.create(data));

    return expense;
  }

  public static async update(expense: Expense, data: DeepPartial<Expense>) {
    const updatedExpense = await this.expenseRepository.save(this.expenseRepository.merge(expense, data));

    return updatedExpense;
  }

  public static async remove(expense: Expense) {
    const removedExpense = await this.expenseRepository.remove(expense);
    console.log(removedExpense);
    return removedExpense;
  }
}
