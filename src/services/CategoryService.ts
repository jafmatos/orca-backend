import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  filter: {
    userId: string;
    when?: {
      ge?: string;
      le?: string;
    };
  };
  order?: {
    column: "name" | "mark";
    mode: "ASC" | "DESC";
  };
};

export class CategoryService {
  private static readonly categoryRepository = dataSource.getRepository(Category);

  public static async list(options: ListOptions) {
    const queryBuilder = dataSource
      .createQueryBuilder(Category, "category")
      .select("category")
      .addSelect("COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0)::double precision as spent")
      .where("(category.userId = :userId)", { userId: options.filter.userId })
      .andWhere("(category.removedAt IS NULL)");

    if (options.order) {
      queryBuilder.orderBy(options.order.column, options.order.mode);
    } else {
      queryBuilder.orderBy("category.name", "ASC");
    }

    queryBuilder.leftJoin(
      "entry",
      "entry",
      `category.id = entry.categoryId AND entry.type = 'expense' AND (DATE(entry.when) BETWEEN :ge::date AND :le::date)`,
      {
        ge: options.filter.when?.ge,
        le: options.filter.when?.le,
      }
    );

    queryBuilder.groupBy("category.name");
    queryBuilder.addGroupBy("category.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map<Category>((entity, index) => {
      return {
        ...entity,
        spent: raw[index].spent as number,
      };
    });
  }

  public static async findById(id: Category["id"]) {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });

    return category;
  }

  public static async findOneBy(where: FindOptionsWhere<Category>) {
    const category = await this.categoryRepository.findOne({
      where,
      withDeleted: true,
    });

    return category;
  }

  public static async exists(id: Category["id"]) {
    const exists = await this.categoryRepository.existsBy({
      id,
    });

    return exists;
  }

  public static async create(data: DeepPartial<Category>) {
    const category = await this.categoryRepository.save(this.categoryRepository.create(data));

    return category;
  }

  public static async update(category: Category, data: DeepPartial<Category>) {
    const updatedCategory = await this.categoryRepository.save(this.categoryRepository.merge(category, data));

    return updatedCategory;
  }

  public static async remove(category: Category) {
    const removedCategory = await this.categoryRepository.remove(category);

    return removedCategory;
  }

  public static async softRemove(category: Category) {
    const removedCategory = await this.categoryRepository.update(category.id, {
      removedAt: () => "CURRENT_TIMESTAMP",
    });

    return removedCategory;
  }

  public static async recover(category: Category) {
    const recoveredCategory = await this.categoryRepository.update(category.id, {
      removedAt: null,
    });

    return recoveredCategory;
  }
}
