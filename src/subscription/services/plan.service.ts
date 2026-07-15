import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan) private readonly planRepository: Repository<Plan>,
  ) {}

  async findAll() {
    return await this.planRepository.find();
  }

  async findAllWhere(where?: FindOptionsWhere<Plan>) {
    return await this.planRepository.find({
      where,
    });
  }

  async findById(id: string) {
    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .addSelect('COUNT(subscriptions)', 'activeSubscriptions')
      .leftJoin(
        'plan.subscriptions',
        'subscriptions',
        "subscriptions.status = 'active' OR subscriptions.status = 'trialing'",
      )
      .where('plan.id = :id', { id })
      .groupBy('plan.id');

    const { raw, entities } = await queryBuilder.getRawAndEntities();

    return entities.map((e, index) => {
      e.activeSubscriptions = +raw[index].activeSubscriptions!;
      return e;
    })[0];
  }

  async create(plan: DeepPartial<Plan>) {
    return await this.planRepository.save(this.planRepository.create(plan));
  }

  async update(plan: Plan, data: Partial<Plan>) {
    return await this.planRepository.save(
      this.planRepository.merge(plan, data),
    );
  }

  async remove(plan: Plan) {
    return await this.planRepository.remove(plan);
  }
}
