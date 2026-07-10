import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';

describe('Admin (e2e)', () => {
  describe('Admin Users', () => {
    it('[List] - Deve retornar a lista de usuários com paginação', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const response = await api()
        .get('/admin/users')
        .set('Authorization', `Bearer ${superToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.count).toBeGreaterThan(0);
    });
  });

  describe('Admin Overview', () => {
    it('[KPIs] - Deve retornar os KPIs gerais da plataforma', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const response = await api()
        .get('/admin/overview/kpis')
        .set('Authorization', `Bearer ${superToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body.kpis).toHaveProperty('totalUsers');
      expect(response.body.kpis).toHaveProperty('activeSubscriptions');
      expect(response.body.kpis).toHaveProperty('mrr');
    });
  });
});
