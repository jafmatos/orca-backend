import { dataSource } from "Src/database/data-source";
import { Entry } from "Src/database/entities/Entry.entity";
import { EntryTypes } from "Src/types/EntryTypes";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
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

export class EntryService {
  private static readonly entryRepository = dataSource.getRepository(Entry);

  public static async list(options: ListOptions) {
    const queryBuilder = this.entryRepository
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.category", "category")
      .where("(entry.userId = :userId)", { userId: options.filter.userId })
      .andWhere("(entry.removedAt IS NULL)")
      .andWhere("(category.removedAt IS NULL)");

    queryBuilder.andWhere(`(DATE(entry.when) BETWEEN :ge::date AND :le::date)`, {
      ge: options.filter.when?.ge,
      le: options.filter.when?.le,
    });

    options.filter?.type && queryBuilder.andWhere("(entry.type = :type)", { type: options.filter!.type! });
    options.filter?.category && queryBuilder.andWhere("(category.id = :category)", { category: options.filter!.category! });
    options.filter?.text &&
      queryBuilder.andWhere(
        "(category.name ILIKE :text OR entry.description ILIKE :text OR to_char(entry.amount, 'FM999999999999999999D00') ILIKE REPLACE(:text, '.', ''))",
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

  public static async softRemove(entry: Entry) {
    const removedEntry = await this.entryRepository.update(entry.id, {
      removedAt: () => "CURRENT_TIMESTAMP",
    });

    return removedEntry;
  }

  public static async remove(entry: Entry) {
    const removedEntry = await this.entryRepository.remove(entry);

    return removedEntry;
  }
}
