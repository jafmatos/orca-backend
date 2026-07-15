import { Plan } from '@/subscription/entities/plan.entity';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

export type AdminUserListOptions = {
  order?: {
    entity: 'user';
    column: string;
    mode: 'ASC' | 'DESC';
  };
  filter?: {
    stripeId?: string;
    role?: UserRoles;
    text?: string;
    email?: string;
    name?: string;
    isEmailConfirmed?: boolean;
    subscription?: {
      status?: SubscriptionStatuses;
    };
  };
  pagination?: {
    skip?: number;
    take?: number;
  };
};

@Injectable()
export class AdministrativeUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  public async find(options: AdminUserListOptions) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscription', 'subscription')
      .leftJoinAndSelect('user.avatar', 'avatar');

    if (options.filter?.stripeId) {
      queryBuilder.andWhere('user.stripeId = :stripeId', {
        stripeId: options.filter.stripeId,
      });
    }

    if (options.filter?.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.filter.role });
    }

    if (options.filter?.email) {
      queryBuilder.andWhere('user.email = :email', {
        email: options.filter.email,
      });
    }

    if (options.filter?.name) {
      queryBuilder.andWhere('user.name = :name', { name: options.filter.name });
    }

    if (options.filter?.isEmailConfirmed !== undefined) {
      queryBuilder.andWhere('user.isEmailConfirmed = :isEmailConfirmed', {
        isEmailConfirmed: options.filter.isEmailConfirmed,
      });
    }

    if (options.filter?.text) {
      queryBuilder.andWhere(
        '(user.email ILIKE :text OR user.name ILIKE :text)',
        { text: `%${options.filter.text}%` },
      );
    }

    if (options.filter?.subscription?.status) {
      queryBuilder.andWhere('subscription.status = :status', {
        status: options.filter.subscription.status,
      });
    }

    if (options.order) {
      queryBuilder.orderBy(
        `${options.order.entity}.${options.order.column}`,
        options.order.mode,
      );
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    if (options.pagination?.skip !== undefined) {
      queryBuilder.skip(options.pagination.skip);
    }
    if (options.pagination?.take !== undefined) {
      queryBuilder.take(options.pagination.take);
    }

    return await queryBuilder.getManyAndCount();
  }

  public async updateUser(id: string, data: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    
    this.userRepository.merge(user, data);
    return await this.userRepository.save(user);
  }

  public async findOneBy(where: FindOptionsWhere<User>) {
    return await this.userRepository.findOne({
      where,
      relations: { subscription: true },
    });
  }

  public async findPlan(planId: string) {
    return await this.planRepository.findOneBy({ id: planId });
  }

  public createSubscriptionWithoutSaving(data: Partial<Subscription>) {
    return this.subscriptionRepository.create(data);
  }

  public async saveSubscription(subscription: Subscription) {
    return await this.subscriptionRepository.save(subscription);
  }

  public async findSubscriptionByUserId(userId: string) {
    return await this.subscriptionRepository.findOneBy({ userId });
  }

  public async updateSubscriptionEntity(
    subscription: Subscription,
    updateData: Partial<Subscription>,
  ) {
    const updatedSubscription = this.subscriptionRepository.merge(
      subscription,
      updateData,
    );
    return await this.subscriptionRepository.save(updatedSubscription);
  }
}
