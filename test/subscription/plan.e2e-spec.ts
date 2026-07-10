import { PlanDurationInterval } from '@/subscription/entities/plan.entity';
import { $faker } from '@Test/helpers/$faker';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { PlanHelper } from '@Test/helpers/plan.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Plans (e2e)', () => {
  it('[List] - Deve ser capaz de listar os planos', async () => {
    const { body } = await api().get('/plans').expect(200);

    expect(body.plans.length).toBeGreaterThan(0);

    for (const plan of body.plans) {
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeDefined();
      expect(plan).toHaveProperty('trialPeriodDays');
      expect(plan).toHaveProperty('benefits');
      expect(plan).toHaveProperty('duration');
      expect(plan.benefits.length).toBeGreaterThan(0);
      expect([
        PlanDurationInterval.Monthly,
        PlanDurationInterval.Yearly,
      ]).toContain(plan.duration.interval);
      expect(plan.duration.intervalCount).toBeGreaterThan(0);
    }
  });

  it('[Show] - Deve ser capaz de encontrar um plano', async () => {
    const plan = await PlanHelper.getOne();
    const { body } = await api().get(`/plans/${plan.id}`).expect(200);

    expect(body.plan).toBeDefined();
    expect(body.plan.name).toBe(plan.name);
    expect(body.plan.price).toBe(plan.price);
    expect(body.plan.trialPeriodDays).toBe(plan.trialPeriodDays);
    expect(body.plan.duration).toBeDefined();
    expect(body.plan.duration.interval).toBe(plan.duration.interval);
    expect(body.plan.duration.intervalCount).toBe(plan.duration.intervalCount);
    expect(JSON.stringify(body.plan.benefits)).toBe(
      JSON.stringify(plan.benefits),
    );
  });

  it('[Show] - Deve falhar ao tentar encontrar um plano inexistente', async () => {
    const { body } = await api()
      .get(`/plans/${$faker.string.uuid()}`)
      .expect(404);

    expect(body.message).toBe('Plano não encontrado');
  });

  it('[Create] - Deve ser capaz de cadastrar um plano caso o usuário seja um super usuário', async () => {
    const token = await AuthHelper.getSuperToken();
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      trialPeriodDays: $faker.number.int({ min: 7, max: 30 }),
      benefits: [$faker.lorem.words(3)],
    };

    const { body } = await api()
      .post('/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(body.plan).toBeDefined();
    expect(body.plan.name).toBe(payload.name);
    expect(body.plan.price).toBe(payload.price);
    expect(body.plan.trialPeriodDays).toBe(payload.trialPeriodDays);
    expect(body.plan.benefits).toEqual(payload.benefits);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um plano caso o usuário não esteja autenticado', async () => {
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      benefits: [$faker.lorem.words(3)],
    };

    await api().post('/plans').send(payload).expect(401);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um plano caso o usuário autenticado seja um usuário comum', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      benefits: [$faker.lorem.words(3)],
    };

    const { body } = await api()
      .post('/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar um plano caso o usuário autenticado seja um administrador', async () => {
    const user = await UserHelper.getOneByRole('admin');
    const token = await AuthHelper.signIn(user);
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      benefits: [$faker.lorem.words(3)],
    };

    const { body } = await api()
      .post('/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar um plano caso o valor seja menor que zero', async () => {
    const token = await AuthHelper.getSuperToken();
    const payload = {
      name: $faker.commerce.productName(),
      price: -1 * $faker.number.float({ min: 1, max: 100 }),
      benefits: [$faker.lorem.words(3)],
    };

    const { body } = await api()
      .post('/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(body.errors).toBeTruthy();
    expect(body.errors[0]).toBeTruthy();
    expect(body.errors[0].path).toEqual(['price']);
    expect(body.errors[0].message).toBe('Valor mínimo: R$ 0,00');
  });

  it('[Create] - Deve falhar ao tentar cadastrar um plano caso o número de dias de teste seja menor que zero', async () => {
    const token = await AuthHelper.getSuperToken();
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      trialPeriodDays: -1 * $faker.number.int({ min: 1, max: 30 }),
      benefits: [$faker.lorem.words(3)],
    };

    const { body } = await api()
      .post('/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(body.errors).toBeTruthy();
    expect(body.errors[0]).toBeTruthy();
    expect(body.errors[0].path).toEqual(['trialPeriodDays']);
    expect(body.errors[0].message).toBe(
      'O número de dias não pode ser negativo',
    );
  });

  it('[Update] - Deve ser capaz de atualizar um plano', async () => {
    const token = await AuthHelper.getSuperToken();
    const plan = await PlanHelper.create();
    const payload = {
      name: $faker.commerce.productName(),
      price: Number($faker.commerce.price()),
      trialPeriodDays: $faker.number.int({ min: 7, max: 30 }),
      benefits: [$faker.lorem.words(5)],
    };

    const { body } = await api()
      .put(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(body.plan).toBeDefined();
    expect(body.plan.id).toBe(plan.id);
    expect(body.plan.name).toBe(payload.name);
    expect(body.plan.price).toBe(payload.price);
    expect(body.plan.trialPeriodDays).toBe(payload.trialPeriodDays);
    expect(body.plan.benefits).toEqual(payload.benefits);
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano caso o usuário não esteja autenticado', async () => {
    const plan = await PlanHelper.create();
    const payload = {
      name: $faker.commerce.productName(),
    };

    await api().put(`/plans/${plan.id}`).send(payload).expect(401);
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano caso o usuário autenticado seja um usuário comum', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const plan = await PlanHelper.create();
    const payload = {
      name: $faker.commerce.productName(),
    };

    const { body } = await api()
      .put(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano caso o usuário autenticado seja um administrador', async () => {
    const user = await UserHelper.getOneByRole('admin');
    const token = await AuthHelper.signIn(user);
    const plan = await PlanHelper.create();
    const payload = {
      name: $faker.commerce.productName(),
    };

    const { body } = await api()
      .put(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano inexistente', async () => {
    const token = await AuthHelper.getSuperToken();
    const payload = {
      name: $faker.commerce.productName(),
    };

    const { body } = await api()
      .put(`/plans/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404);

    expect(body.message).toBe('Plano não encontrado');
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano caso o preço seja menor que zero', async () => {
    const token = await AuthHelper.getSuperToken();
    const plan = await PlanHelper.create();
    const payload = {
      price: -1 * $faker.number.float({ min: 1, max: 100 }),
    };

    const { body } = await api()
      .put(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(body.errors).toBeTruthy();
    expect(body.errors[0]).toBeTruthy();
    expect(body.errors[0].path).toEqual(['price']);
    expect(body.errors[0].message).toBe('Valor mínimo: R$ 0,00');
  });

  it('[Update] - Deve falhar ao tentar atualizar um plano caso o número de dias de teste seja menor que zero', async () => {
    const token = await AuthHelper.getSuperToken();
    const plan = await PlanHelper.create();
    const payload = {
      trialPeriodDays: -1 * $faker.number.int({ min: 1, max: 30 }),
    };

    const { body } = await api()
      .put(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(body.errors).toBeTruthy();
    expect(body.errors[0]).toBeTruthy();
    expect(body.errors[0].path).toEqual(['trialPeriodDays']);
    expect(body.errors[0].message).toBe(
      'O número de dias não pode ser negativo',
    );
  });

  it('[Remove] - Deve ser capaz de remover um plano', async () => {
    const token = await AuthHelper.getSuperToken();
    const plan = await PlanHelper.create();

    const { body } = await api()
      .delete(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body.plan.name).toBe(plan.name);
  });

  it('[Remove] - Deve falhar ao tentar encontrar um plano após removê-lo', async () => {
    const token = await AuthHelper.getSuperToken();
    const plan = await PlanHelper.create();

    await api()
      .delete(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api().get(`/plans/${plan.id}`).expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover um plano caso o usuário não esteja autenticado', async () => {
    const plan = await PlanHelper.create();

    await api().delete(`/plans/${plan.id}`).expect(401);

    await api().get(`/plans/${plan.id}`).expect(200);
  });

  it('[Remove] - Deve falhar ao tentar remover um plano caso o usuário autenticado seja um usuário comum', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const plan = await PlanHelper.create();

    const { body } = await api()
      .delete(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );

    await api().get(`/plans/${plan.id}`).expect(200);
  });

  it('[Remove] - Deve falhar ao tentar remover um plano caso o usuário autenticado seja um administrador', async () => {
    const user = await UserHelper.getOneByRole('admin');
    const token = await AuthHelper.signIn(user);
    const plan = await PlanHelper.create();

    const { body } = await api()
      .delete(`/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );

    await api().get(`/plans/${plan.id}`).expect(200);
  });

  it('[Remove] - Deve falhar ao tentar remover um plano inexistente', async () => {
    const token = await AuthHelper.getSuperToken();

    const { body } = await api()
      .delete(`/plans/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(body.message).toBe('Plano não encontrado');
  });

  it('[Remove] - Deve falhar ao tentar remover um plano caso exista alguma inscrição para ele', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.getSuperToken();

    expect(user.subscription).toBeDefined();
    expect(user.subscription?.planId).toBeDefined();

    const { body } = await api()
      .delete(`/plans/${user.subscription?.planId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(body.message).toBe(
      'Não foi possível remover o plano pois há assinaturas ativas nele',
    );
  });
});
