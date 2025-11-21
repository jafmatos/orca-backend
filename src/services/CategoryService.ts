import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category.entity";
import { DeepPartial, FindOptionsWhere } from "typeorm";

export type ListOptions = {
  filter: {
    userId: string;
  };
};

export class CategoryService {
  private static readonly categoryRepository = dataSource.getRepository(Category);

  public static async list(options: ListOptions) {
    const queryBuilder = dataSource
      .createQueryBuilder(Category, "category")
      .select("category")
      .leftJoinAndSelect("category.limit", "limit")
      .where("(category.userId = :userId)", { userId: options.filter.userId })
      .andWhere("(category.removedAt IS NULL)");

    return await queryBuilder.getMany();
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
