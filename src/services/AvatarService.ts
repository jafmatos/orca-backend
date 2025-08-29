import { dataSource } from "Src/database/data-source";
import { Avatar } from "Src/database/entities/Avatar.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial, Transaction } from "typeorm";

export class AvatarService {
  private static readonly avatarRepository = dataSource.getRepository(Avatar);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.avatarRepository;

    return transaction.manager.getRepository(Avatar);
  }

  public static async create(data: DeepPartial<Avatar>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);
    const avatar = await repository.save(repository.create(data));

		return avatar;
  }

  public static async remove(avatar: Avatar, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.remove(avatar);
  }
}
