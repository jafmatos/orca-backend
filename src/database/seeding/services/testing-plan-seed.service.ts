import { Injectable } from '@nestjs/common';
import { Seeder } from '../Seeder';
import { Plan } from '@/subscription/entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';

@Injectable()
export class TestingPlanSeedService implements Seeder<Plan[]> {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async seed(): Promise<Plan[]> {
    const plansData: DeepPartial<Plan>[] = Array.from({ length: 1 }).map(
      () => ({
        name: $faker.commerce.productName(),
        price: $faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
        description: $faker.commerce.productDescription(),
        benefits: Array.from({
          length: $faker.number.int({ min: 3, max: 12 }),
        }).map(() => $faker.lorem.sentence({ min: 3, max: 8 })),
        currency: 'BRL',
        interval: 'month',
      }),
    );

    const plans = await this.planRepository.save(
      this.planRepository.create(plansData),
    );

    return plans;
  }
}
