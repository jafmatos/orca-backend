import { dataSource } from "Src/database/data-source";
import { Subscription } from "Src/database/entities/Subscription.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export class SubscriptionService {
  private static readonly subscriptionRepository = dataSource.getRepository(Subscription);

  public static async getRepository(transaction?: TypeormTransaction) {
    if (!transaction) return this.subscriptionRepository;

    return transaction.manager.getRepository(Subscription);
  }

  public static async findOne(where: FindOptionsWhere<Subscription>) {
    const subscription = await this.subscriptionRepository.findOne({
      where,
    });

    return subscription;
  }

  public static async create(data: DeepPartial<Subscription>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);
    const subscription = await repository.save(repository.create(data));

    return subscription;
  }

  public static async update(subscription: Subscription, data: DeepPartial<Subscription>, options?: { transaction: TypeormTransaction }) {
    const repository = await this.getRepository(options?.transaction);
    const updatedSubscription = await repository.save(repository.merge(subscription, data));

    return updatedSubscription;
  }
}
