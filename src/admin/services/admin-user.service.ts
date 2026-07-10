import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/user/entities/user.entity';
import { UserRoles } from '@/user/entities/user.entity';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';

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
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  public async updateRole(id: string, role: UserRoles) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    user.role = role;
    return await this.userRepository.save(user);
  }
}
