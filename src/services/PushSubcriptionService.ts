import { dataSource } from "Src/database/data-source";
import { PushSubscription } from "Src/database/entities/PushSubscription.entity";
import { DeepPartial } from "typeorm";

export class PushSubscriptionService {
  private static readonly pushSubscriptionRepository = dataSource.getRepository(PushSubscription);

  public static async findAll() {
    return await this.pushSubscriptionRepository.find();
  }

  public static async findById(id: string) {
    return await this.pushSubscriptionRepository.findOneBy({
      id,
    });
  }

  public static async create(pushSubscription: DeepPartial<PushSubscription>) {
    return await this.pushSubscriptionRepository.save(this.pushSubscriptionRepository.create(pushSubscription));
  }

  public static async update(pushSubscription: PushSubscription, data: Partial<PushSubscription>) {
    return await this.pushSubscriptionRepository.save(this.pushSubscriptionRepository.merge(pushSubscription, data));
  }

  public static async remove(pushSubscription: PushSubscription) {
    return await this.pushSubscriptionRepository.remove(pushSubscription);
  }
}
