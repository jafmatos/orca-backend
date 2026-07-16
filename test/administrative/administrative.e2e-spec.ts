import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';
import { PlanHelper } from '@Test/helpers/plan.helper';
import { $faker } from '@Test/helpers/$faker';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { UserRoles } from '@/user/entities/user.entity';

describe('Admin (e2e)', () => {
  describe('Admin Users', () => {
    it('[List] - Deve retornar a lista de usuários com paginação', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const response = await api()
        .get('/administrative/users')
        .set('Authorization', `Bearer ${superToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.count).toBeGreaterThan(0);
    });

    it('[List] - Deve falhar ao listar caso o usuário não esteja autenticado', async () => {
      await api().get('/administrative/users').expect(401);
    });

    it('[List] - Deve falhar ao listar caso o usuário autenticado seja um usuário comum', async () => {
      const user = await UserHelper.getOneByRole('user');
      const token = await AuthHelper.signIn(user);
      
      const { body } = await api()
        .get('/administrative/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
        
      expect(body.message).toBe('Você não tem permissão para acessar este recurso');
    });

    it('[Update] - Deve atualizar os dados de um usuário', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await UserHelper.getOneByRole(UserRoles.User);
      
      const payload = {
        name: $faker.person.fullName(),
        email: $faker.internet.email(),
        role: UserRoles.Admin,
        isBetaTester: true,
      };

      const response = await api()
        .put(`/administrative/users/${user.id}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(payload.name);
      expect(response.body.user.email).toBe(payload.email);
      expect(response.body.user.role).toBe(payload.role);
      expect(response.body.user.isBetaTester).toBe(payload.isBetaTester);
    });

    it('[Update] - Deve falhar ao tentar atualizar um usuário caso o usuário não esteja autenticado', async () => {
      const user = await UserHelper.getOneByRole(UserRoles.User);
      await api().put(`/administrative/users/${user.id}`).expect(401);
    });

    it('[Update] - Deve falhar ao tentar atualizar um usuário caso o usuário autenticado seja um usuário comum', async () => {
      const user = await UserHelper.getOneByRole(UserRoles.User);
      const token = await AuthHelper.signIn(user);
      
      const { body } = await api()
        .put(`/administrative/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
        
      expect(body.message).toBe('Você não tem permissão para acessar este recurso');
    });

    it('[Update] - Deve falhar ao tentar atualizar um usuário inexistente', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const { body } = await api()
        .put(`/administrative/users/${$faker.string.uuid()}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ name: 'test' })
        .expect(404);
        
      expect(body.message).toBe('Usuário não encontrado');
    });

    it('[Update] - Deve falhar caso a validação do payload dê erro', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await UserHelper.getOneByRole(UserRoles.User);
      
      const { body } = await api()
        .put(`/administrative/users/${user.id}`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ email: 'invalid-email' })
        .expect(422);

      expect(body.errors).toBeTruthy();
      expect(body.errors[0].path).toEqual(['email']);
    });

    it('[Assign Subscription] - Deve atribuir uma inscrição a um usuário', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await AuthHelper.signUp();
      const plan = await PlanHelper.getOne();

      const payload = {
        planId: plan.id,
        status: SubscriptionStatuses.PastDue,
      };

      const response = await api()
        .post(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('subscription');
      expect(response.body.subscription.userId).toBe(user.id);
      expect(response.body.subscription.planId).toBe(payload.planId);
      expect(response.body.subscription.status).toBe(payload.status);
    });

    it('[Assign Subscription] - Deve falhar ao tentar atribuir uma inscrição caso o usuário não esteja autenticado', async () => {
      const user = await AuthHelper.signUp();
      await api().post(`/administrative/users/${user.id}/subscription`).expect(401);
    });

    it('[Assign Subscription] - Deve falhar ao tentar atribuir uma inscrição caso o usuário autenticado seja um usuário comum', async () => {
      const user = await AuthHelper.signUp();
      const userCommon = await UserHelper.getOneByRole('user');
      const token = await AuthHelper.signIn(userCommon);
      
      const { body } = await api()
        .post(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
        
      expect(body.message).toBe('Você não tem permissão para acessar este recurso');
    });

    it('[Assign Subscription] - Deve falhar caso o usuário não seja encontrado', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const plan = await PlanHelper.getOne();

      const { body } = await api()
        .post(`/administrative/users/${$faker.string.uuid()}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ planId: plan.id })
        .expect(404);
        
      expect(body.message).toBe('Usuário não encontrado');
    });

    it('[Assign Subscription] - Deve falhar caso o plano não seja encontrado', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await AuthHelper.signUp();

      const { body } = await api()
        .post(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ planId: $faker.string.uuid() })
        .expect(404);
        
      expect(body.message).toBe('Plano não encontrado');
    });

    it('[Assign Subscription] - Deve falhar caso o usuário já possua uma inscrição', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await UserHelper.getOneSubscribed(UserRoles.User);
      const plan = await PlanHelper.getOne();

      const { body } = await api()
        .post(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ planId: plan.id })
        .expect(400);
        
      expect(body.message).toBe('Este usuário já possui uma inscrição');
    });

    it('[Update Subscription] - Deve atualizar a inscrição de um usuário', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await UserHelper.getOneSubscribed(UserRoles.User);
      const plan = await PlanHelper.getOne();

      const payload = {
        planId: plan.id,
        status: SubscriptionStatuses.Canceled,
      };

      const response = await api()
        .put(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('subscription');
      expect(response.body.subscription.userId).toBe(user.id);
      expect(response.body.subscription.planId).toBe(payload.planId);
      expect(response.body.subscription.status).toBe(payload.status);
    });

    it('[Update Subscription] - Deve falhar ao tentar atualizar uma inscrição caso o usuário não esteja autenticado', async () => {
      const user = await UserHelper.getOneSubscribed(UserRoles.User);
      await api().put(`/administrative/users/${user.id}/subscription`).expect(401);
    });

    it('[Update Subscription] - Deve falhar ao tentar atualizar uma inscrição caso o usuário autenticado seja um usuário comum', async () => {
      const user = await UserHelper.getOneSubscribed(UserRoles.User);
      const userCommon = await UserHelper.getOneByRole('user');
      const token = await AuthHelper.signIn(userCommon);
      
      const { body } = await api()
        .put(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
        
      expect(body.message).toBe('Você não tem permissão para acessar este recurso');
    });

    it('[Update Subscription] - Deve falhar caso o usuário não seja encontrado', async () => {
      const superToken = await AuthHelper.getSuperToken();
      
      const { body } = await api()
        .put(`/administrative/users/${$faker.string.uuid()}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ status: SubscriptionStatuses.Canceled })
        .expect(404);
        
      expect(body.message).toBe('Usuário não encontrado');
    });

    it('[Update Subscription] - Deve falhar caso a inscrição não seja encontrada', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await AuthHelper.signUp();
      
      const { body } = await api()
        .put(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ status: SubscriptionStatuses.Canceled })
        .expect(404);
        
      expect(body.message).toBe('Inscrição não encontrada');
    });

    it('[Update Subscription] - Deve falhar caso o novo plano não seja encontrado', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const user = await UserHelper.getOneSubscribed(UserRoles.User);

      const { body } = await api()
        .put(`/administrative/users/${user.id}/subscription`)
        .set('Authorization', `Bearer ${superToken}`)
        .send({ planId: $faker.string.uuid() })
        .expect(404);
        
      expect(body.message).toBe('Plano não encontrado');
    });
  });

  describe('Admin Overview', () => {
    it('[KPIs] - Deve retornar os KPIs gerais da plataforma', async () => {
      const superToken = await AuthHelper.getSuperToken();
      const response = await api()
        .get('/administrative/overview/kpis')
        .set('Authorization', `Bearer ${superToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body.kpis).toHaveProperty('totalUsers');
      expect(response.body.kpis).toHaveProperty('activeSubscriptions');
      expect(response.body.kpis).toHaveProperty('mrr');
    });
  });
});
