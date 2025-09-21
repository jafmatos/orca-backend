import { dataSource } from "Src/database/data-source";
import { UserKey } from "Src/database/entities/UserKey.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export class UserKeyService {
  public static readonly userKeyRepository = dataSource.getRepository(UserKey);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.userKeyRepository;

    return transaction.manager.getRepository(UserKey);
  }

  public static async findById(id: UserKey["id"]) {
    const category = await this.userKeyRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });

    return category;
  }

  public static async findOneBy(where: FindOptionsWhere<UserKey>) {
    const category = await this.userKeyRepository.findOne({
      where,
      relations: {
        user: true,
      },
    });

    return category;
  }

  public static async create(key: DeepPartial<UserKey>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.save(repository.create(key));
  }

  public static async update(key: UserKey, data: Partial<UserKey>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.save(repository.merge(key, data));
  }

  public static async remove(key: UserKey, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.remove(key);
  }

  public static async delete(where: FindOptionsWhere<UserKey>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return repository.delete(where);
  }
}
