import { EntryTypes } from '@/common/enums/entry-types.enum';
import { $faker } from '@Test/helpers/$faker';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { CategoryHelper } from '@Test/helpers/category.helper';
import { EntryHelper } from '@Test/helpers/entry.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Categories (e2e)', () => {
  it('[List] - Deve ser capaz de listar as categorias sem paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body } = await api()
      .get('/categories?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body.data).toBeTruthy();

    for (const category of body.data) {
      expect(category.id).toBeTruthy();
      expect(Object.values(EntryTypes)).toContain(category.type);
      expect(category).toHaveProperty('isActive');
      expect(category.name).toBeTruthy();
      expect(category.userId).toBe(user.id);
      expect(category).toHaveProperty('limit');
      expect(category).toHaveProperty('spent');

      if (!category.limit) continue;

      expect(category.limit.id).toBeTruthy();
      expect(category.limit.amount).toBeTruthy();
      expect(category.limit.userId).toBe(user.id);
      expect(category.limit.categoryId).toBe(category.id);
    }
  });

  it('[List] - Deve ser capaz de listar as categorias usando paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const page = 1;
    const perPage = 10;

    const { body: data } = await api()
      .get(`/categories?page=${page}&perPage=${perPage}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { body: dataWithoutPagination } = await api()
      .get('/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data).toBeTruthy();
    expect(data.meta).toBeTruthy();
    expect(data.meta.count).toBeGreaterThanOrEqual(
      dataWithoutPagination.data.length,
    );
    expect(data.meta.page).toBe(page);
    expect(data.meta.perPage).toBe(perPage);
    expect(data.meta.pages).toBe(
      Math.ceil(dataWithoutPagination.meta.count / perPage),
    );
  });

  it('[List] - Deve calcular corretamente o valor gasto por categoria de acordo com o ciclo do usuário', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: response } = await api()
      .get('/categories?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    for await (const category of response.data) {
      if (category.type !== EntryTypes.Expense) continue;

      const entries = await EntryHelper.getMany(token, {
        category: category.id,
        when: {
          ge: user.currentCycle.start,
          le: user.currentCycle.end,
        },
      });

      const expectedAmount = entries.reduce(
        (acc, entry) => acc + entry.amount,
        0,
      );

      expect(category.spent).toBeCloseTo(expectedAmount);
    }
  });

  it('[List] - Deve calcular corretamente o valor gasto por categoria quando estiver utilizando filtros de data', async () => {
    const amount_0 = $faker.number.float({
      min: 10,
      max: 1000,
      fractionDigits: 2,
    });
    const amount_1 = $faker.number.float({
      min: 10,
      max: 1000,
      fractionDigits: 2,
    });
    const amount_2 = $faker.number.float({
      min: 10,
      max: 1000,
      fractionDigits: 2,
    });

    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    const uniqueYear =
      new Date().getFullYear() + $faker.number.int({ min: 10, max: 100 });
    const when1 = new Date(Date.UTC(uniqueYear, 5, 10, 12, 0, 0)).toISOString();
    const when2 = new Date(Date.UTC(uniqueYear, 5, 15, 12, 0, 0)).toISOString();
    const when3 = new Date(Date.UTC(uniqueYear, 5, 20, 12, 0, 0)).toISOString();

    await api()
      .post('/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: { id: category.id },
        amount: amount_0,
        type: 'expense',
        when: when1,
        description: 'Entry 1',
      })
      .expect(201);

    await api()
      .post('/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: { id: category.id },
        amount: amount_2,
        type: 'expense',
        when: when2,
        description: 'Entry 2',
      })
      .expect(201);

    await api()
      .post('/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: { id: category.id },
        amount: amount_1,
        type: 'expense',
        when: when3,
        description: 'Entry 3',
      })
      .expect(201);

    const filter = encodeURIComponent(
      JSON.stringify({
        when: {
          ge: new Date(Date.UTC(uniqueYear, 5, 12, 0, 0, 0)).toISOString(),
          le: new Date(Date.UTC(uniqueYear, 5, 18, 23, 59, 59)).toISOString(),
        },
      }),
    );

    const { body: response } = await api()
      .get(`/categories?filter=${filter}&paginated=false`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const matched = response.data.find((c: any) => c.id === category.id);
    expect(matched).toBeTruthy();
    expect(matched.spent).toBeCloseTo(amount_2);
  });

  it('[List] - Deve falhar ao tentar listar as categorias caso o usuário não esteja autenticado', async () => {
    await api().get('/categories').expect(401);
  });

  it('[List] - Deve falhar ao tentar listar as categorias caso o usuário autenticado seja um administrador', async () => {
    const user = await UserHelper.getOneByRole('admin');
    const token = await AuthHelper.signIn(user);
    const { body: data } = await api()
      .get('/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(data.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[List] - Deve falhar ao tentar listar as categorias caso o usuário autenticado seja um super usuário', async () => {
    const token = await AuthHelper.getSuperToken();
    const { body: data } = await api()
      .get('/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(data.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Show] - Deve ser capaz de encontrar uma categoria', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.getOne(token);

    const { body: data } = await api()
      .get(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.category.id).toBe(category.id);
    expect(data.category.userId).toBe(category.userId);
    expect(data.category.type).toBe(category.type);
    expect(data.category.isActive).toBe(category.isActive);
    expect(data.category.name).toBe(category.name);
    expect(data.category).toHaveProperty('limit');

    if (category.limit) {
      expect(data.category.limit.id).toBe(category.limit.id);
      expect(data.category.limit.userId).toBe(category.limit.userId);
      expect(data.category.limit.categoryId).toBe(category.limit.categoryId);
      expect(data.category.limit.amount).toBe(category.limit.amount);
    }
  });

  it('[Show] - Deve falhar ao tentar encontrar uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get(`/categories/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Categoria não encontrada');
  });

  it('[Show] - Deve falhar ao tentar encontrar uma categoria caso o usuário não esteja autenticado', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.getOne(token);

    const { body: data } = await api()
      .get(`/categories/${category.id}`)
      .expect(401);
  });

  it('[Show] - Deve falhar ao tentar encontrar uma categoria caso ela pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const userOneCategory = await CategoryHelper.getOne(userOneToken);

    const { body: data } = await api()
      .get(`/categories/${userOneCategory.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);

    expect(data.message).toBe('Categoria não encontrada');
  });

  it('[Create] - Deve ser capaz de cadastrar uma categoria de receita sem definir um limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Income,
      name: $faker.commerce.department(),
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.category).toBeTruthy();
    expect(data.category.id).toBeTruthy();
    expect(data.category.userId).toBe(user.id);
    expect(data.category.type).toBe(payload.type);
    expect(data.category.name).toBe(
      payload.name.toLowerCase().replace(/^./, payload.name[0].toUpperCase()),
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma categoria de receita definindo um limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Income,
      name: $faker.commerce.department(),
      limit: { amount: 100 },
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors[0]).toBeTruthy();
    expect(data.errors[0].path).toEqual(['limit']);
    expect(data.errors[0].message).toBe(
      'Não é possível definir um limite para categorias de receita',
    );
  });

  it('[Create] - Deve ser capaz de cadastrar uma categoria de despesa sem definir um limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Expense,
      name: $faker.commerce.department(),
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.category).toBeTruthy();
    expect(data.category.id).toBeTruthy();
    expect(data.category.userId).toBe(user.id);
    expect(data.category.type).toBe(payload.type);
  });

  it('[Create] - Deve ser capaz de cadastrar uma categoria de despesa definindo um limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Expense,
      name: $faker.commerce.department(),
      limit: { amount: 150.5 },
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.category).toBeTruthy();
    expect(data.category.limit).toBeTruthy();
    expect(data.category.limit.amount).toBe(payload.limit.amount);
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma categoria de despesa caso o limite definido seja igual a zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Expense,
      name: $faker.commerce.department(),
      limit: { amount: 0 },
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors[0].path).toEqual(['limit', 'amount']);
    expect(data.errors[0].message).toBe(
      'O valor do limite deve ser maior que zero',
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma categoria de despesa caso o limite definido seja menor que zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Expense,
      name: $faker.commerce.department(),
      limit: { amount: -10 },
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors[0].path).toEqual(['limit', 'amount']);
    expect(data.errors[0].message).toBe(
      'O valor do limite deve ser maior que zero',
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma categoria definindo um título com mais de 40 caracteres', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      type: EntryTypes.Expense,
      name: $faker.lorem.paragraph(),
    };

    const { body: data } = await api()
      .post('/categories')
      .send(payload)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors[0].path).toEqual(['name']);
    expect(data.errors[0].message).toBe(
      'O nome da categoria deve ter no máximo 40 caracteres',
    );
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma categoria caso o usuário não esteja autenticado', async () => {
    const payload = {
      type: EntryTypes.Expense,
      name: 'Test',
    };

    await api().post('/categories').send(payload).expect(401);
  });

  it('[Update] - Deve ser capaz de atualizar uma categoria de receita', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Income,
    });

    const payload = {
      name: 'Nova receita',
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(data.category.id).toBe(category.id);
    expect(data.category.name).toBe('Nova receita');
  });

  it('[Update] - Deve ser capaz de atualizar uma categoria removendo o limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
      limit: 100,
    });

    const payload = {
      limit: null,
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(data.category.limit).toBeNull();
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria de receita definindo um limite', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Income,
    });

    const payload = {
      limit: { amount: 100 },
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(data.errors[0].path).toEqual(['limit']);
    expect(data.errors[0].message).toBe(
      'Não é possível definir um limite para categorias de receita',
    );
  });

  it('[Update] - Deve ser capaz de atualizar uma categoria de despesa', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    const payload = {
      limit: { amount: 200 },
      name: 'Supermercado',
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(data.category.name).toBe('Supermercado');
    expect(data.category.limit.amount).toBe(200);
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria de despesa caso o limite definido seja igual a zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    const payload = {
      limit: { amount: 0 },
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(data.errors[0].path).toEqual(['limit', 'amount']);
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria de despesa caso o limite definido seja menor que zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    const payload = {
      limit: { amount: -1 },
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(data.errors[0].path).toEqual(['limit', 'amount']);
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria definindo um título com mais de 40 caracteres', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    const payload = {
      name: $faker.lorem.paragraph(),
    };

    const { body: data } = await api()
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422);

    expect(data.errors[0].path).toEqual(['name']);
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria caso o usuário não esteja autenticado', async () => {
    const payload = { name: 'Test' };
    await api()
      .put(`/categories/${$faker.string.uuid()}`)
      .send(payload)
      .expect(401);
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = { name: 'Test' };
    const { body: data } = await api()
      .put(`/categories/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404);

    expect(data.message).toBe('Categoria não encontrada');
  });

  it('[Update] - Deve falhar ao tentar atualizar uma categoria caso ela pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const userOneCategory = await CategoryHelper.create(userOneToken, {
      type: EntryTypes.Expense,
    });

    const payload = { name: 'Test' };
    const { body: data } = await api()
      .put(`/categories/${userOneCategory.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .send(payload)
      .expect(404);

    expect(data.message).toBe('Categoria não encontrada');
  });

  it('[Remove] - Deve ser capaz de remover uma categoria', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    await api()
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('[Remove] - Deve falhar ao tentar encontrar uma categoria depois de removê-la', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const category = await CategoryHelper.create(token, {
      type: EntryTypes.Expense,
    });

    await api()
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api()
      .get(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover uma categoria caso o usuário não esteja autenticado', async () => {
    await api().delete(`/categories/${$faker.string.uuid()}`).expect(401);
  });

  it('[Remove] - Deve falhar ao tentar remover uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    await api()
      .delete(`/categories/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover uma categoria caso ela pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const userOneCategory = await CategoryHelper.create(userOneToken, {
      type: EntryTypes.Expense,
    });

    await api()
      .delete(`/categories/${userOneCategory.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);
  });
});
