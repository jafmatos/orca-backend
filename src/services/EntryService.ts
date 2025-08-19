import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category.entity";
import { Entry } from "Src/database/entities/Entry.entity";
import { EntryTypes } from "Src/types/EntryTypes";
import { DeepPartial, SelectQueryBuilder } from "typeorm";

type ListOptions = {
  order?: {
    entity?: string;
    column: string;
    mode: "ASC" | "DESC";
  };
  filter?: {
    type?: EntryTypes;
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

export class EntryService {
  private static readonly entryRepository = dataSource.getRepository(Entry);

  private static setListFilters(queryBuilder: SelectQueryBuilder<Entry>, filter: ListOptions["filter"]) {
    if (filter?.type) queryBuilder.andWhere("entry.type = :type", { type: filter!.type! });
    if (filter?.category) queryBuilder.andWhere("category.id = :category", { category: filter!.category! });
    if (filter?.text)
      queryBuilder.andWhere(
        "(category.name LIKE :text OR entry.description LIKE :text OR REPLACE(FORMAT(entry.amount, 2), '.', ',') LIKE :text)",
        { text: `%${filter!.text!}%` }
      );
    if (filter?.when)
      queryBuilder.andWhere("(DATE(entry.when) BETWEEN DATE(:ge) AND DATE(:le))", {
        ge: filter.when.ge || new Date(new Date().getTime() - 100 * 365 * 24 * 60 * 60 * 1000),
        le: filter.when.le || new Date(new Date().getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
      });

    return queryBuilder;
  }

  public static async list(options?: ListOptions) {
    const queryBuilder = this.entryRepository
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.category", "category")
      .where(
        "entry.id IN (SELECT entry.id FROM entry LEFT JOIN category ON entry.categoryId = category.id WHERE category.deletedAt IS NULL)"
      );

    options?.filter && this.setListFilters(queryBuilder, options.filter);

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.entity || "entry"}.${options.order.column}`, options.order.mode || "DESC");
    }

    if (options?.pagination) {
      queryBuilder.skip(options.pagination.skip);
      queryBuilder.take(options.pagination.take);
    }

    const retult = await queryBuilder.getManyAndCount();

    return retult;
  }

  public static async sumUp(options?: SumUpOptions) {
    // const summarizationQueryBuilder = this.entryRepository
    //   .createQueryBuilder("entry")
    //   .select("'BALANÇO' as category, SUM(CASE WHEN type = 'expense' THEN amount * -1 ELSE amount END) as total")
    //   .where(
    //     "entry.id IN (SELECT entry.id FROM entry LEFT JOIN category ON entry.categoryId = category.id WHERE category.deletedAt IS NULL)"
    //   );

    // options?.filter && this.setListFilters(summarizationQueryBuilder, {
    // 	type: options.filter.type,
    // 	when: options.filter.when,
    // });

    const queryBuilder = dataSource
      .createQueryBuilder(Category, "category")
      .select("category.name as category, COALESCE(category.mark, 0) as mark, COALESCE(ROUND(SUM(entry.amount), 2), 0) as spent")
      .leftJoin(
        "entry",
        "entry",
        "category.id = entry.categoryId AND entry.type = 'expense' AND (DATE(entry.when) BETWEEN DATE(:ge) AND DATE(:le))",
        {
          ge: options?.filter?.when?.ge || new Date(new Date().getTime() - 100 * 365 * 24 * 60 * 60 * 1000),
          le: options?.filter?.when?.le || new Date(new Date().getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
        }
      )
      .where("category.deletedAt IS NULL")
      .groupBy("category.name");

    if (options?.filter?.category) queryBuilder.andWhere("category.id = :category", { category: options.filter!.category! });
    if (options?.filter?.text)
      queryBuilder.having(
        "(category.name LIKE :text OR REPLACE(FORMAT(spent, 2), '.', ',') LIKE :text OR REPLACE(FORMAT(mark - spent, 2), '.', ',') LIKE :text OR mark LIKE :text)",
        {
          text: `%${options.filter!.text!}%`,
        }
      );

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.column}`, options.order.mode || "DESC");
    } else {
      queryBuilder.orderBy("category.name", "ASC");
    }

    const sumUp = await queryBuilder.getRawMany();

    return { data: sumUp };
  }

  public static async findById(id: Entry["id"]) {
    const entry = await this.entryRepository.findOneBy({
      id,
    });

    return entry;
  }

  public static async exists(id: Entry["id"]) {
    const exists = await this.entryRepository.existsBy({
      id,
    });

    return exists;
  }

  public static async create(data: DeepPartial<Entry>) {
    const entry = await this.entryRepository.save(this.entryRepository.create(data));

    return entry;
  }

  public static async update(entry: Entry, data: DeepPartial<Entry>) {
    if (data.category === null) data.categoryId = null;

    const updatedEntry = await this.entryRepository.save({ ...entry, ...data });

    return updatedEntry;
  }

  public static async remove(entry: Entry) {
    const removedEntry = await this.entryRepository.remove(entry);

    return removedEntry;
  }
}
