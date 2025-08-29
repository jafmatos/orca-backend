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
      .createQueryBuilder("users")
      .select("users")
      .leftJoinAndSelect("users.avatar", "avatar")
      .where(where)
      .getOne();

    if (!user) return null;

    const { balance } = await this.userRepository
      .createQueryBuilder("users")
      .select(
        "COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as balance"
      )
      .leftJoin(
        "entry",
        "entry",
        "entry.userId = users.id AND (DATE(entry.when) BETWEEN DATE(users.periodGe) AND DATE(users.periodLe)) AND entry.deletedAt is null"
      )
      .where(where)
      .groupBy("users.id")
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
