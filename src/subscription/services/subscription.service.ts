import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  EntityManager,
} from 'typeorm';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  private getRepository(manager?: EntityManager) {
    return manager
      ? manager.getRepository(Subscription)
      : this.subscriptionRepository;
  }

  async findOneBy(where: FindOptionsWhere<Subscription>) {
    return await this.subscriptionRepository.findOne({ where });
  }

  async create(
    data: DeepPartial<Subscription>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.create(data));
  }

  async update(
    subscription: Subscription,
    data: DeepPartial<Subscription>,
    options?: { manager: EntityManager },
  ) {
    const repository = this.getRepository(options?.manager);
    return await repository.save(repository.merge(subscription, data));
  }
}
