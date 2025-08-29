import { dataSource } from "Src/database/data-source";
import { User } from "Src/database/entities/User.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type CreateUserAttributes = Omit<User, "id">;

export class UserService {
  public static readonly userRepository = dataSource.getRepository(User);

  public static async exists(where: FindOptionsWhere<User>) {
    return await this.userRepository.existsBy(where);
  }

  public static async findOneBy(where: FindOptionsWhere<User>) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .select("user")
      .leftJoinAndSelect("user.avatar", "avatar")
      .where(where)
      .getOne();

    const { balance } = await this.userRepository
      .createQueryBuilder("user")
      .select("COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END), 2), 0) as balance")
      .leftJoin(
        "entry",
        "entry",
        "entry.userId = user.id AND (DATE(entry.when) BETWEEN DATE(user.periodGe) AND DATE(user.periodLe)) AND entry.deletedAt is null"
      )
      .where(where)
      .groupBy("user.id")
      .getRawOne();

    if (user) user.balance = balance;

    return user;
  }

  public static async create(user: CreateUserAttributes) {
    return await this.userRepository.save(this.userRepository.create(user));
  }

  public static async update(user: User, data: DeepPartial<User>) {
    return await this.userRepository.save(this.userRepository.merge(user, data));
  }
}
