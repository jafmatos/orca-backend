import { EntryTypes } from '@/common/enums/entry-types.enum';
import {
  Schedule,
  ScheduleFrequency,
} from '@/schedule/entities/schedule.entity';
import { ScheduleOccurrence } from '@/schedule/entities/schedule-occurrence.entity';
import { $faker } from './$faker';
import { api } from './api.helper';

export class ScheduleHelper {
  public static async create(
    token: string,
    data?: {
      type?: EntryTypes;
      amount?: number;
      description?: string;
      frequency?: ScheduleFrequency;
      dayOfWeek?: number;
      dayOfMonth?: number;
      time?: string;
      timezone?: string;
      category?: { id: string };
    },
  ): Promise<Schedule> {
    const type =
      data?.type ?? $faker.helpers.arrayElement(Object.values(EntryTypes));
    const frequency = data?.frequency ?? ScheduleFrequency.Monthly;

    const payload: any = {
      type,
      amount:
        data?.amount ??
        $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description:
        data?.description ?? $faker.commerce.productName().substring(0, 60),
      frequency,
      time:
        data?.time ??
        `${String($faker.number.int({ min: 0, max: 23 })).padStart(2, '0')}:${String($faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}`,
      timezone: data?.timezone ?? 'America/Sao_Paulo',
    };

    if (frequency === ScheduleFrequency.Weekly) {
      payload.dayOfWeek =
        data?.dayOfWeek ?? $faker.number.int({ min: 0, max: 6 });
    } else {
      payload.dayOfMonth =
        data?.dayOfMonth ?? $faker.number.int({ min: 1, max: 28 });
    }

    if (data?.category) {
      payload.category = data.category;
    }

    const { body } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return body.schedule;
  }

  public static async getMany(
    token: string,
    filter?: any,
    pagination?: { page: number; perPage: number },
  ): Promise<Schedule[]> {
    let url = '/schedules?paginated=false';

    if (pagination) {
      url = `/schedules?paginated=true&page=${pagination.page}&perPage=${pagination.perPage}`;
    }

    if (filter) {
      url += `&filter=${encodeURIComponent(JSON.stringify(filter))}`;
    }

    const { body } = await api()
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return body.data;
  }

  public static async getOne(token: string): Promise<Schedule> {
    const schedules = await this.getMany(token);
    return $faker.helpers.arrayElement(schedules);
  }

  public static async createOccurrence(
    scheduleId: string,
    token: string,
    when: string,
  ): Promise<ScheduleOccurrence> {
    const { body } = await api()
      .post(`/schedules/${scheduleId}/occurrence`)
      .set('Authorization', `Bearer ${token}`)
      .send({ when })
      .expect(201);

    return body.occurrence;
  }
}
