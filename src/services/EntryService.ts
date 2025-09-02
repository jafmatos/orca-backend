import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category.entity";
import { Entry } from "Src/database/entities/Entry.entity";
import { EntryTypes } from "Src/types/EntryTypes";
import { DeepPartial, FindOptionsWhere, SelectQueryBuilder } from "typeorm";

type ListOptions = {
  order?: {
    entity?: string;
    column: string;
    mode: "ASC" | "DESC";
  };
  filter: {
    userId: string;
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
  filter: {
    userId: string;
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

  public static async list(options: ListOptions) {
    const queryBuilder = this.entryRepository
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.category", "category")
      .leftJoin("users", "users", "entry.userId = users.id")
      .where(
        "entry.id IN (SELECT entry.id FROM entry LEFT JOIN category ON entry.categoryId = category.id WHERE category.deletedAt IS NULL) AND entry.userId = :userId",
        { userId: options.filter.userId }
      );

    const checkGe = options.filter.when?.ge ? ":ge::date" : "DATE(users.periodGe)";
    const checkLe = options.filter.when?.le ? ":le::date" : "DATE(users.periodLe)";

    queryBuilder.andWhere(`(DATE(entry.when) BETWEEN ${checkGe} AND ${checkLe})`, {
      ge: options.filter.when?.ge,
      le: options.filter.when?.le,
    });

    options.filter?.type && queryBuilder.andWhere("entry.type = :type", { type: options.filter!.type! });
    options.filter?.category && queryBuilder.andWhere("category.id = :category", { category: options.filter!.category! });
    options.filter?.text &&
      queryBuilder.andWhere(
        "(category.name LIKE :text OR entry.description LIKE :text OR REPLACE(FORMAT(entry.amount, 2), '.', ',') LIKE :text)",
        { text: `%${options.filter!.text!}%` }
      );

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.entity || "entry"}.${options.order.column}`, options.order.mode || "DESC");
    }

    if (options?.pagination) {
      queryBuilder.skip(options.pagination.skip);
      queryBuilder.take(options.pagination.take);
    }

    const result = await queryBuilder.getManyAndCount();

    return result;
  }

  public static async findById(id: Entry["id"]) {
    const entry = await this.entryRepository.findOneBy({
      id,
    });

    return entry;
  }

  public static async findOneBy(where: FindOptionsWhere<Entry>) {
    const entry = await this.entryRepository.findOneBy(where);

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
