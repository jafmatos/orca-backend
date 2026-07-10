import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { Limit } from '../entities/limit.entity';

export type LimitListOptions = {
  pagination?: {
    skip?: number;
    take?: number;
  };
  filter: {
    userId: string;
    when?: {
      ge?: Date;
      le?: Date;
    };
  };
};

@Injectable()
export class LimitService {
  constructor(
    @InjectRepository(Limit)
    private readonly limitRepository: Repository<Limit>,
  ) {}

  async list(options: LimitListOptions): Promise<[Limit[], number]> {
    const limitIdsQuery = this.limitRepository.find({
      where: { userId: options.filter.userId },
      skip: options.pagination?.skip,
      take: options.pagination?.take,
      select: { id: true },
    });

    const limitIdsResult = await limitIdsQuery;
    const limitIds = limitIdsResult.map((l) => l.id);

    if (limitIds.length === 0) {
      const count = await this.limitRepository.count({
        where: { userId: options.filter.userId },
      });
      return [[], count];
    }

    const queryBuilder = this.limitRepository
      .createQueryBuilder('limit_entity')
      .select('limit_entity')
      .addSelect(
        'COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0)::double precision as spent',
      )
      .leftJoinAndSelect('limit_entity.category', 'category')
      .leftJoin(
        'entry',
        'entry',
        `category.id = entry."categoryId" AND entry.type::VARCHAR = category.type::VARCHAR AND (entry."when" BETWEEN :ge AND :le)`,
        {
          ge: options.filter.when?.ge,
          le: options.filter.when?.le,
        },
      )
      .where('limit_entity.id IN (:...limitIds)', { limitIds })
      .groupBy('"limit_entity"."id"')
      .addGroupBy('category.id');

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const count = await this.limitRepository.count({
      where: { userId: options.filter.userId },
    });

    const limits = entities.map<Limit>((entity, index) => {
      return {
        ...entity,
        spent: raw[index].spent as number,
      };
    });

    return [limits, count];
  }

  async findOneBy(where: FindOptionsWhere<Limit>): Promise<Limit | null> {
    return this.limitRepository.findOne({
      where,
      relations: { category: true },
    });
  }

  async create(data: DeepPartial<Limit>): Promise<Limit> {
    const limit = this.limitRepository.create(data);
    return this.limitRepository.save(limit);
  }

  async update(limit: Limit, data: DeepPartial<Limit>): Promise<Limit> {
    const updatedLimit = this.limitRepository.merge(limit, data);
    return this.limitRepository.save(updatedLimit);
  }

  async remove(limit: Limit): Promise<void> {
    await this.limitRepository.remove(limit);
  }
}
