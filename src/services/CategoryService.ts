import { dataSource } from "Src/database/data-source";
import { Category } from "Src/database/entities/Category";
import { DeepPartial } from "typeorm";

type ListOptions = {
  withDeleted: boolean;
};

export class CategoryService {
  private static readonly categoryRepository = dataSource.getRepository(Category);

  public static async list(options?: ListOptions) {
    const categories = await this.categoryRepository.find(options);

    return categories;
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
