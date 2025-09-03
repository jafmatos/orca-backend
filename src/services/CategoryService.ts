import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  order?: {
    entity?: string;
    column: string;
    mode: "ASC" | "DESC";
  };
  filter: {
    userId: string;
    text?: string;
    category?: string;
    when?: {
      ge?: string;
      le?: string;
    };
  };
};

export class CategoryService {
  private static readonly categoryRepository = dataSource.getRepository(Category);

  public static async list(options: ListOptions) {
    const queryBuilder = dataSource
      .createQueryBuilder(Category, "category")
      .select("category")
      .addSelect("COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0)::double precision as spent")
      .leftJoin("users", "users", "category.userId = users.id AND category.deletedAt IS NULL");

    const checkGe = options.filter.when?.ge ? ":ge::date" : "DATE(users.periodGe)";
    const checkLe = options.filter.when?.le ? ":le::date" : "DATE(users.periodLe)";

    queryBuilder.leftJoin(
      "entry",
      "entry",
      `category.id = entry.categoryId AND entry.type = 'expense' AND (DATE(entry.when) BETWEEN ${checkGe} AND ${checkLe})`,
      {
        ge: options.filter.when?.ge,
        le: options.filter.when?.le,
      }
    );

    queryBuilder.where("category.deletedAt IS NULL AND category.userId = :userId", { userId: options?.filter.userId });
    queryBuilder.groupBy("category.name");
    queryBuilder.addGroupBy("category.id");

    if (options?.filter?.category) queryBuilder.andWhere("category.id = :category", { category: options.filter!.category! });

		// This is totally broken lol
    // if (options?.filter?.text)
    //   queryBuilder.having(
    //     "(category.name ILIKE :text OR to_char(COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0) as text, 'FM999999999999999999D00') ILIKE REPLACE(:text, '.', '') OR to_char(category.mark - COALESCE(ROUND(SUM(entry.amount)::numeric, 2), 0) as text, 'FM999999999999999999D00') ILIKE REPLACE(:text, '.', '') OR mark ILIKE :text)",
    //     {
    //       text: `%${options.filter!.text!}%`,
    //     }
    //   );

    if (options?.order?.column) {
      queryBuilder.orderBy(`${options.order.column}`, options.order.mode || "DESC");
    } else {
      queryBuilder.orderBy("category.name", "ASC");
    }

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
    const removedCategory = await this.categoryRepository.softRemove(category);

    return removedCategory;
  }

  public static async recover(category: Category) {
    const recoveredCategory = await this.categoryRepository.recover(category);

    return recoveredCategory;
  }
}
