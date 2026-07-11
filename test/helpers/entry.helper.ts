import { EntryTypes } from '@/common/enums/entry-types.enum';
import { api } from './api.helper';
import { $faker } from './$faker';
import { Entry } from '@/entry/entities/entry.entity';

export class EntryHelper {
  public static async create(
    token: string,
    data?: {
      type?: EntryTypes;
      amount?: number;
      description?: string;
      when?: string;
      category?: { id?: string; name?: string } | null;
    },
  ): Promise<Entry> {
    const type =
      data?.type ?? $faker.helpers.arrayElement(Object.values(EntryTypes));

    const payload: any = {
      type,
      amount:
        data?.amount ??
        $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      when: data?.when ?? new Date().toISOString(),
    };

    if (data?.description !== undefined) {
      payload.description = data.description;
    } else {
      payload.description = $faker.commerce.productName().substring(0, 60);
    }

    if (data?.category !== undefined) {
      payload.category = data.category;
    }

    const { body } = await api()
      .post('/entries')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return body.entry;
  }

  public static async getMany(
    token: string,
    filter?: any,
    order?: any,
  ): Promise<Entry[]> {
    let url = '/entries?paginated=false';

    if (filter) {
      url += `&filter=${encodeURIComponent(JSON.stringify(filter))}`;
    }

    if (order) {
      url += `&order=${encodeURIComponent(JSON.stringify(order))}`;
    }

    const { body } = await api()
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return body.data;
  }

  public static async getOne(token: string): Promise<Entry> {
    const entries = await this.getMany(token);
    return entries[Math.floor(Math.random() * entries.length)];
  }

  public static generatePayload(overrides?: any) {
    return {
      type: $faker.helpers.arrayElement(Object.values(EntryTypes)),
      amount: $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description: $faker.commerce.productName().substring(0, 60),
      when: new Date().toISOString(),
      ...overrides,
    };
  }
}
