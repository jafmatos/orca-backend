import { dataSource } from "Src/database/data-source";
import { EntryRecurrency } from "Src/database/entities/EntryRecurrency.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial } from "typeorm";

export class EntryRecurrencyService {
  private static readonly entryRecurrencyRepository = dataSource.getRepository(EntryRecurrency);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.entryRecurrencyRepository;

    return transaction.manager.getRepository(EntryRecurrency);
  }

  public static async findAll() {
    return await this.entryRecurrencyRepository.find();
  }

  public static async findById(id: string) {
    return await this.entryRecurrencyRepository.findOneBy({
      id,
    });
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
