import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, FindOptionsWhere, DeepPartial } from 'typeorm';
import { User } from '@/user/entities/user.entity';

export type CreateUserAttributes = Omit<User, 'id'>;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(User) : this.userRepository;
  }

  async exists(where: FindOptionsWhere<User>) {
    return await this.userRepository.existsBy(where);
  }

  async findById(id: string) {
    return await this.userRepository.findOneBy({ id });
  }

  async findOneWithBalanceBy(where: FindOptionsWhere<User>) {
    const user = await this.userRepository
      .createQueryBuilder('users')
      .select('users')
      .leftJoinAndSelect('users.avatar', 'avatar')
      // Note: we can add subscriptions here later when migrated
      .where(where)
      .getOne();

    if (!user) return null;

    const { balance } = await this.userRepository
      .createQueryBuilder('users')
      .select(
        "COALESCE(ROUND(SUM(CASE WHEN entry.type = 'expense' THEN -entry.amount ELSE entry.amount END)::numeric, 2), 0)::double precision as balance",
      )
      .leftJoin('entry', 'entry', 'entry.userId = users.id AND (entry.when BETWEEN users.periodGe AND users.periodLe)')
      .where(where)
      .groupBy('users.id')
      .getRawOne() || { balance: 0 };

    if (user) user.balance = balance;

    return user;
  }

  async create(user: Partial<User>, options?: { manager: EntityManager }) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.create(user));
  }

  async update(user: User, data: DeepPartial<User>, options?: { manager: EntityManager }) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.merge(user, data));
  }

  async remove(user: User, options?: { manager: EntityManager }) {
    const repository = this.getRepository(options?.manager);
    return await repository.remove(user);
  }
}
