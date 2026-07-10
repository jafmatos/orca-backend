import { EntryTypes } from '@/common/enums/entry-types.enum';
import { $faker } from './$faker';
import { api } from './api.helper';
import { Category } from '@/category/entities/category.entity';

export class CategoryHelper {
  public static async create(
    token: string,
    data?: { type?: EntryTypes; limit?: number | null },
  ): Promise<Category> {
    const type = data?.type ?? EntryTypes.Expense;

    let payload: any = {
      name: $faker.commerce.department(),
      type,
    };

    if (type === EntryTypes.Expense) {
      if (data?.limit !== null) {
        payload.limit = {
          amount: data?.limit ?? $faker.number.float({ min: 10, max: 1000 }),
        };
      }
    }

    const { body } = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return body.category;
  }

  public static async getMany(token: string): Promise<Category[]> {
    const { body } = await api()
      .get('/categories?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return body.data;
  }

  public static async getOne(token: string, type?: EntryTypes) {
    const categories = await this.getMany(token);

    let filtered = categories;

    if (type) {
      filtered = categories.filter((c: any) => c.type === type);
    }

    return $faker.helpers.arrayElement(filtered) as Category;
  }
}
