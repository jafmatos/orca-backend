import { Category } from '@/category/entities/category.entity';
import { EntryTypes } from '@/common/enums/entry-types.enum';
import { User, UserRoles } from '@/user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { $faker } from '../utils/$faker';
import { Seeder } from '../Seeder';

@Injectable()
export class TestingCategorySeedService implements Seeder<Category[]> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async seed() {
    const users = await this.userRepository.find({
      where: {
        role: UserRoles.User,
        isEmailConfirmed: true,
      },
    });

    const categoriesData: DeepPartial<Category>[] = [];

    for (const user of users) {
      const numCategories = $faker.number.int({ min: 20, max: 30 });

      for (let i = 0; i < numCategories; i++) {
        const type =
          i + 1 < numCategories / 3
            ? EntryTypes.Income
            : i + 1 > numCategories - numCategories / 3
              ? EntryTypes.Expense
              : $faker.helpers.arrayElement(Object.values(EntryTypes));
        const categoryData: DeepPartial<Category> = {
          userId: user.id,
          name: $faker.commerce.department(),
          type,
        };

        if (type === EntryTypes.Expense && $faker.datatype.boolean()) {
          categoryData.limit = {
            userId: user.id,
            amount: $faker.number.float({
              min: 50,
              max: 2000,
              fractionDigits: 2,
            }),
          };
        }

        categoriesData.push(categoryData);
      }
    }

    const categories = await this.categoryRepository.save(categoriesData);

    return categories;
  }
}
