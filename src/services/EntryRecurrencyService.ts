import { dataSource } from "Src/database/data-source";
import { Entry } from "Src/database/entities/Entry.entity";
import { EntryRecurrency } from "Src/database/entities/EntryRecurrency.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial } from "typeorm";

type EntryRecurrencyListOptions = {
  pagination?: {
    skip: number;
    take: number;
  };
  filter: {
    userId: string;
  };
};

export class EntryRecurrencyService {
  private static readonly entryRecurrencyRepository = dataSource.getRepository(EntryRecurrency);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.entryRecurrencyRepository;

    return transaction.manager.getRepository(EntryRecurrency);
  }

  public static async list(options: EntryRecurrencyListOptions) {
    const queryBuilder = dataSource.getRepository(Entry).createQueryBuilder("entry");
    const idQuery = this.entryRecurrencyRepository
      .createQueryBuilder()
      .from(EntryRecurrency, "recurrency")
      .select("entry.id", "id")
      .distinctOn(["recurrency.id"])
      .where("recurrency.userId = :userId", { userId: options.filter.userId })
      .leftJoinAndSelect("recurrency.entries", "entry", "entry.recurrencyId = recurrency.id AND entry.removedAt IS NULL")
      .orderBy("recurrency.id", "ASC")
      .addOrderBy("entry.when", "DESC");

    const ids = await idQuery.getRawMany();

    return await queryBuilder
      .leftJoinAndSelect("entry.recurrency", "recurrency")
      .leftJoinAndSelect("entry.category", "category")
      .where(`entry.id IN (:...ids)`, { ids: ids.map(({ id }) => id) })
      .orderBy("entry.when", "ASC")
      .getManyAndCount();
  }

  public static async create(recurrency: DeepPartial<EntryRecurrency>) {
    return await this.entryRecurrencyRepository.save(this.entryRecurrencyRepository.create(recurrency));
  }

  public static async update(recurrency: EntryRecurrency, data: Partial<EntryRecurrency>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.save(this.entryRecurrencyRepository.merge(recurrency, data));
  }

  public static async remove(recurrency: EntryRecurrency) {
    return await this.entryRecurrencyRepository.remove(recurrency);
  }
}
