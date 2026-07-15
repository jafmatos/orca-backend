import { Plan, PlanDurationInterval } from '@/subscription/entities/plan.entity';
import { $faker } from './$faker';
import { api } from './api.helper';
import { AuthHelper } from './auth.helper';

export class PlanHelper {
  public static async getMany(): Promise<Plan[]> {
    const {
      body: { plans },
    } = await api().get('/plans').expect(200);

    return plans;
  }

  public static async getOne(): Promise<Plan> {
    const plans = await this.getMany();

    return plans[Math.floor(Math.random() * plans.length)];
  }

  public static async create(data?: Partial<Plan>): Promise<Plan> {
    const superToken = await AuthHelper.getSuperToken();

    const payload = {
      name: data?.name || $faker.commerce.productName(),
      price: data?.price ?? Number($faker.commerce.price()),
      trialPeriodDays:
        data?.trialPeriodDays ?? $faker.number.int({ min: 7, max: 30 }),
      benefits: data?.benefits || [
        $faker.lorem.words(3),
        $faker.lorem.words(3),
      ],
      duration: data?.duration || {
        interval: PlanDurationInterval.Monthly,
        intervalCount: 1,
      },
      isPrivate: data?.isPrivate ?? false,
    };

    const response = await api()
      .post('/administrative/plans')
      .set('Authorization', `Bearer ${superToken}`)
      .send(payload)
      .expect(201);

    return response.body.plan;
  }
}
