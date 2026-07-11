import { Plan } from '@/subscription/entities/plan.entity';
import { Subscription } from '@/subscription/entities/subscription.entity';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';
import { Seeder } from '../Seeder';

@Injectable()
export class TestingSubscriptionSeedService implements Seeder<Subscription[]> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async seed() {
    const users = await this.userRepository.find({
      where: {
        role: UserRoles.User,
        isEmailConfirmed: true,
      },
    });
    const plans = await this.planRepository.find();

    const subscriptionsData = users
      .filter(() => Math.random() < 0.5)
      .map((user, index, array) => {
        const plan = plans[Math.floor(Math.random() * plans.length)];

        const subscriptionData: DeepPartial<Subscription> = {
          userId: user.id,
          planId: plan.id,
          stripeId: $faker.string.uuid(),
        };

        subscriptionData.status =
          index < array.length / 5
            ? SubscriptionStatuses.Active
            : $faker.helpers.arrayElement(Object.values(SubscriptionStatuses));

        if (subscriptionData.status === SubscriptionStatuses.Trialing) {
          const trialStart = $faker.date.recent({ days: 30 });
          const trialEnd = new Date(trialStart);

          trialEnd.setMonth(trialStart.getMonth() + 1);

          subscriptionData.trialStart = trialStart;
          subscriptionData.trialEnd = trialEnd;
          subscriptionData.currentPeriodStart = trialStart;
          subscriptionData.currentPeriodEnd = trialEnd;
        }

        if (
          !subscriptionData.currentPeriodStart ||
          !subscriptionData.currentPeriodEnd
        ) {
          const periodStart = $faker.date.recent({ days: 30 });
          const periodEnd = new Date(periodStart);

          periodEnd.setMonth(periodStart.getMonth() + 1);

          subscriptionData.currentPeriodStart = periodStart;
          subscriptionData.currentPeriodEnd = periodEnd;
        }

        return this.subscriptionRepository.create(subscriptionData);
      });

    const subscriptions =
      await this.subscriptionRepository.save(subscriptionsData);

    return subscriptions;
  }
}
