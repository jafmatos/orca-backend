import { dataSource } from "Src/database/data-source";
import { User, UserRoles } from "Src/database/entities/User.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  order?: {
    entity?: string;
    column: string;
    mode: "ASC" | "DESC";
  };
  filter: {
    stripeId?: string;
    role?: UserRoles;
    text?: string;
    email?: string;
    name?: string;
    isEmailConfirmed?: boolean;
  };
  pagination: {
    skip: number;
    take: number;
  };
};

export type CreateUserAttributes = Omit<User, "id">;

export class UserService {
  public static readonly userRepository = dataSource.getRepository(User);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.userRepository;

    return transaction.manager.getRepository(User);
  }

  public static async find(options: ListOptions) {
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    options.filter.stripeId && queryBuilder.andWhere(`user.stripeId = :stripeId`, { stripeId: options.filter.stripeId });
    options.filter.role && queryBuilder.andWhere(`user.role = :role`, { role: options.filter.role });
    options.filter.email && queryBuilder.andWhere(`user.email = :email`, { email: options.filter.email });
    options.filter.name && queryBuilder.andWhere(`user.name = :name`, { name: options.filter.name });
    options.filter.isEmailConfirmed &&
      queryBuilder.andWhere(`user.isEmailConfirmed = :isEmailConfirmed`, { isEmailConfirmed: options.filter.isEmailConfirmed });
    options.filter.text && queryBuilder.andWhere(`user.email ILIKE :text OR user.name ILIKE :text`, { text: `%${options.filter.text}%` });

    queryBuilder.skip(options.pagination.skip);
    queryBuilder.take(options.pagination.take);

    return await queryBuilder.getManyAndCount();
  }

  public static async exists(where: FindOptionsWhere<User>) {
    return await this.userRepository.existsBy(where);
  }

  public static async findById(id: User["id"]) {
    const user = await this.userRepository.findOneBy({ id });

    return user;
  }

  public static async findByIdWithPushSubscriptions(id: User["id"]) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        pushSubscriptions: true,
      },
    });

    return user;
  }

  public static async findOneByWithoutRelations(where: FindOptionsWhere<User>) {
    const user = await this.userRepository.findOneBy(where);

    return user;
  }

  public static async findOneBy(where: FindOptionsWhere<User>) {
    const user = await this.userRepository
      .createQueryBuilder("users")
      .select("users")
      .leftJoinAndSelect("users.avatar", "avatar")
      .leftJoinAndSelect("users.subscription", "subscription")
      .leftJoinAndSelect("subscription.plan", "plan")
      .where(where)
      .getOne();

    if (!user) return null;

    const { balance } = await this.userRepository
      .createQueryBuilder("users")
      .select(
        "COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as balance"
      )
      .leftJoin("entry", "entry", "entry.userId = users.id AND (DATE(entry.when) BETWEEN DATE(users.periodGe) AND DATE(users.periodLe))")
      .where(where)
      .groupBy("users.id")
      .getRawOne();

    if (user) user.balance = balance;

    return user;
  }

  public static async create(user: CreateUserAttributes, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.save(repository.create(user));
  }

  public static async update(user: User, data: DeepPartial<User>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.save(repository.merge(user, data));
  }

  public static async remove(user: User, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);

    return await repository.remove(user);
  }
}
