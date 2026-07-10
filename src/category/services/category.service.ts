import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { Category } from '../entities/category.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';

export type CategoryListOptions = {
  pagination?: {
    skip?: number;
    take?: number;
  };
  filter: {
    type?: EntryTypes;
    userId: string;
    when?: {
      ge?: Date;
      le?: Date;
    };
  };
  order?: {
    column: keyof Category | 'spent';
    mode: 'ASC' | 'DESC';
  };
};

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async list(options: CategoryListOptions): Promise<[Category[], number]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .select('category')
      .addSelect(
        'COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0)::double precision as spent',
      )
      .addSelect('COUNT(*) OVER() as count')
      .leftJoinAndSelect('category.limit', 'limit')
      .leftJoin(
        'entry',
        'entry',
        `category.id = entry."categoryId" AND entry.type::VARCHAR = category.type::VARCHAR AND (entry.when BETWEEN :ge AND :le)`,
        {
          ge: options.filter.when?.ge,
          le: options.filter.when?.le,
        },
      )
      .where('(category."userId" = :userId)', { userId: options.filter.userId })
      .groupBy('category.name')
      .addGroupBy('category.id')
      .addGroupBy('limit.id');

    if (options.pagination?.skip !== undefined) {
      queryBuilder.skip(options.pagination.skip);
    }

    if (options.pagination?.take !== undefined) {
      queryBuilder.take(options.pagination.take);
    }

    if (options.filter.type) {
      queryBuilder.andWhere(`(category.type = :type)`, {
        type: options.filter.type,
      });
    }

    const count = await queryBuilder.getCount();

    if (options.order) {
      if (options.order.column === 'spent') {
        queryBuilder.orderBy('spent', options.order.mode);
      } else {
        queryBuilder
          .orderBy(`category.${options.order.column}`, options.order.mode)
          .addOrderBy('category.name', 'ASC');
      }
    } else {
      queryBuilder
        .orderBy('category.type', 'ASC')
        .addOrderBy('category.name', 'ASC');
    }

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    const categories = entities.map<Category>((entity, index) => {
      return {
        ...entity,
        spent: raw[index].spent as number,
      };
    });

    return [categories, count];
  }

  async findOneBy(where: FindOptionsWhere<Category>): Promise<Category | null> {
    return this.categoryRepository.findOne({ where });
  }

  async create(data: DeepPartial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async update(
    category: Category,
    data: DeepPartial<Category>,
  ): Promise<Category> {
    const updatedCategory = this.categoryRepository.merge(category, data);
    return this.categoryRepository.save(updatedCategory);
  }

  async remove(category: Category): Promise<void> {
    await this.categoryRepository.remove(category);
  }

  async removeLimit(categoryId: string): Promise<void> {
    await this.categoryRepository.manager.delete('limit', { categoryId });
  }
}
