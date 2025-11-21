import { dataSource } from "Src/database/data-source";
import { Limit } from "Src/database/entities/Limit.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  filter: {
    userId: string;
    when?: {
      ge?: string;
      le?: string;
    };
  };
  pagination?: {
    skip: number;
    take: number;
  };
};

export class LimitService {
  private static readonly limitRepository = dataSource.getRepository(Limit);

  public static async list(options: ListOptions) {
    const queryBuilder = dataSource
      .createQueryBuilder(Limit, "limit")
      .select("limit")
      .leftJoinAndSelect("limit.category", "category")
      .addSelect("COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0)::double precision as spent")
      .addSelect("COUNT(*) OVER() as count")
      .where("(category.userId = :userId)", { userId: options.filter.userId })
      .andWhere("(category.removedAt IS NULL)");

    queryBuilder.leftJoin(
      "entry",
      "entry",
      `category.id = entry.categoryId AND entry.type::VARCHAR = category.type::VARCHAR AND (DATE(entry.when) BETWEEN :ge::date AND :le::date) AND entry.removedAt IS NULL`,
      {
        ge: options.filter.when?.ge,
        le: options.filter.when?.le,
      }
    );

    queryBuilder.groupBy("category.name");
    queryBuilder.addGroupBy("category.id");
    queryBuilder.addGroupBy("limit.id");

    if (options.pagination) {
      queryBuilder.skip(options.pagination.skip);
      queryBuilder.take(options.pagination.take);
    }

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const limits = entities.map<Limit>((entity, index) => {
      return {
        ...entity,
        spent: raw[index].spent as number,
      };
    });

		return [limits, +raw[0].count || 0] as [Limit[], number];
  }

  public static async findById(id: Limit["id"]) {
    const limit = await this.limitRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    return limit;
  }

  public static async findOneBy(where: FindOptionsWhere<Limit>) {
    const limit = await this.limitRepository.findOne({
      where,
      withDeleted: true,
    });

    return limit;
  }

  public static async exists(id: Limit["id"]) {
    const exists = await this.limitRepository.existsBy({
      id,
    });

    return exists;
  }

  public static async create(data: DeepPartial<Limit>) {
    const limit = await this.limitRepository.save(this.limitRepository.create(data));

    return limit;
  }

  public static async update(limit: Limit, data: DeepPartial<Limit>) {
    const updatedLimit = await this.limitRepository.save(this.limitRepository.merge(limit, data));

    return updatedLimit;
  }

  public static async remove(limit: Limit) {
    const removedLimit = await this.limitRepository.remove(limit);

    return removedLimit;
  }
}
