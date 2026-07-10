import { Analysis } from '@/analysis/entities/analysis.entity';
import { api } from './api.helper';
import { $faker } from './$faker';

export class AnalysisHelper {
  static async getMany(token: string): Promise<Analysis[]> {
    const { body } = await api()
      .get('/analyses?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return body.data;
  }

  static async getOne(token: string): Promise<Analysis> {
    const analyses = await this.getMany(token);

    return $faker.helpers.arrayElement(analyses);
  }

  static async create(token: string): Promise<Analysis> {
    const { body } = await api()
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    return body.analysis;
  }
}
