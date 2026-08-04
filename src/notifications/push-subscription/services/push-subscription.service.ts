import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { PushSubscription } from '../entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionService {
  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
  ) {}

  async create(data: DeepPartial<PushSubscription>): Promise<PushSubscription> {
    const subscription = this.pushSubscriptionRepository.create(data);
    return await this.pushSubscriptionRepository.save(subscription);
  }

  async findOneBy(
    where: FindOptionsWhere<PushSubscription>,
  ): Promise<PushSubscription | null> {
    return await this.pushSubscriptionRepository.findOneBy(where);
  }

  async findAllBy(
    where: FindOptionsWhere<PushSubscription>,
  ): Promise<PushSubscription[]> {
    return await this.pushSubscriptionRepository.findBy(where);
  }

  async remove(subscription: PushSubscription): Promise<PushSubscription> {
    return await this.pushSubscriptionRepository.remove(subscription);
  }
}
