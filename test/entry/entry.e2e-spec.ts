import { EntryTypes } from '@/common/enums/entry-types.enum';
import { $faker } from '@Test/helpers/$faker';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { EntryHelper } from '@Test/helpers/entry.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Entries (e2e)', () => {
  it('[List] - Deve ser capaz de listar os lançamentos sem filtro', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get('/entries?take=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);

    for (const entry of data.data) {
      expect(entry.id).toBeTruthy();
      expect(entry.userId).toBe(user.id);
      expect([EntryTypes.Income, EntryTypes.Expense]).toContain(entry.type);
      expect(entry.amount).toBeGreaterThan(0);
      expect(entry.description).toBeTruthy();
      expect(new Date(entry.when).getFullYear()).toBeTruthy();

      if (entry.category) {
        expect(entry.category.id).toBeTruthy();
        expect(entry.category.name).toBeTruthy();
      }
    }
  });

  it('[List] - Deve ser capaz de listar os lançamentos usando paginação com cursor (take)', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const take = 10;

    const { body: data } = await api()
      .get(`/entries?take=${take}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data).toBeTruthy();
    expect(data.meta).toBeTruthy();
    expect(data.meta.take).toBe(take);

    if (data.data.length === take) {
      expect(typeof data.meta.nextCursor).toBe('string');
    }
  });

  it('[List] - Deve ser capaz de filtrar os lançamentos pela data', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const randomEntry = await EntryHelper.getOne(token);
    const entryDate = new Date(randomEntry.when);
    const year = entryDate.getUTCFullYear();
    const month = entryDate.getUTCMonth();
    const date = entryDate.getUTCDate();

    const ge = new Date(Date.UTC(year, month, date, 0, 0, 0));
    const le = new Date(Date.UTC(year, month, date, 23, 59, 59));

    const filter = encodeURIComponent(
      JSON.stringify({
        when: {
          ge: ge.toISOString(),
          le: le.toISOString(),
        },
      }),
    );

    const { body: data } = await api()
      .get(`/entries?take=100&filter=${filter}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data.length).toBeGreaterThan(0);

    for (const entry of data.data) {
      const whenAsTime = new Date(entry.when).getTime();
      expect(whenAsTime).toBeGreaterThanOrEqual(ge.getTime());
      expect(whenAsTime).toBeLessThanOrEqual(le.getTime());
    }
  });

  it('[List] - Deve ser capaz de filtrar os lançamentos pelo tipo', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const filter = encodeURIComponent(
      JSON.stringify({ type: EntryTypes.Expense }),
    );

    const { body: data } = await api()
      .get(`/entries?filter=${filter}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data.length).toBeGreaterThan(0);

    for (const entry of data.data) {
      expect(entry.type).toBe(EntryTypes.Expense);
    }
  });

  it('[List] - Deve ser capaz de filtrar os lançamentos pela categoria', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    let randomEntry = await EntryHelper.getOne(token);

    while (!randomEntry.category) {
      randomEntry = await EntryHelper.getOne(token);
    }

    const categoryId = randomEntry.category.id;

    const filter = encodeURIComponent(JSON.stringify({ category: categoryId }));

    const { body: data } = await api()
      .get(`/entries?paginated=false&filter=${filter}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data.length).toBeGreaterThan(0);

    for (const entry of data.data) {
      expect(entry.category.id).toBe(categoryId);
    }
  });

  it('[List] - Deve ser capaz de filtrar os lançamentos ordenando pela data', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const orderDirection = ['ASC', 'DESC'][Math.round(Math.random())] as
      'ASC' | 'DESC';
    const order = encodeURIComponent(
      JSON.stringify({ column: 'when', mode: orderDirection }),
    );

    const { body: data } = await api()
      .get(`/entries?paginated=false&order=${order}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    let previousDate: Date | undefined;

    for (const entry of data.data) {
      const date = new Date(entry.when);

      if (!previousDate) {
        previousDate = date;

        continue;
      }

      if (orderDirection === 'ASC') {
        expect(date.getTime()).toBeGreaterThanOrEqual(previousDate.getTime());
      } else {
        expect(date.getTime()).toBeLessThanOrEqual(previousDate.getTime());
      }

      previousDate = date;
    }
  });

  it('[List] - Deve falhar ao tentar listar os lançamentos caso o usuário não esteja autenticado', async () => {
    await api().get('/entries?take=100').expect(401);
  });

  it('[Show] - Deve ser capaz de encontrar um lançamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const randomEntry = await EntryHelper.getOne(token);

    const { body: data } = await api()
      .get(`/entries/${randomEntry.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.entry).toBeTruthy();
    expect(data.entry.id).toBe(randomEntry.id);
    expect(data.entry.userId).toBe(randomEntry.userId);
    expect(data.entry.type).toBe(randomEntry.type);
    expect(data.entry.amount).toBe(randomEntry.amount);
    expect(data.entry.description).toBe(randomEntry.description);

    if (data.entry.category) {
      expect(data.entry.category.id).toBe(randomEntry.category!.id);
    }
  });

  it('[Show] - Deve falhar ao tentar encontrar um lançamento inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get(`/entries/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Lançamento não encontrado');
  });

  it('[Show] - Deve falhar ao tentar encontrar um lançamento caso ele pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);

    const randomUserOneEntry = await EntryHelper.getOne(userOneToken);

    const { body: data } = await api()
      .get(`/entries/${randomUserOneEntry.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);

    expect(data.message).toBe('Lançamento não encontrado');
  });

  it('[Create] - Deve ser capaz de cadastrar um lançamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const body = EntryHelper.generatePayload();

    const { body: data } = await api()
      .post('/entries')
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.entry.id).toBeTruthy();
    expect(data.entry.userId).toBe(user.id);
    expect(data.entry.type).toBe(body.type);
    expect(data.entry.amount).toBe(body.amount);
    expect(data.entry.description).toBe(body.description);
    expect(data.entry.when).toBe(body.when);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um lançamento caso o usuário não esteja autenticado', async () => {
    const body = EntryHelper.generatePayload();
    await api().post('/entries').send(body).expect(401);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um lançamento caso o valor seja menor do que o mínimo', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const body = EntryHelper.generatePayload({ amount: -5 });

    const { body: data } = await api()
      .post('/entries')
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors[0].path).toEqual(['amount']);
    expect(data.errors[0].message).toBe('Valor mínimo: R$ 0,01');
  });

  it('[Create] - Deve falhar ao tentar cadastrar um lançamento caso a data seja inválida', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const body = EntryHelper.generatePayload({ when: 'invalid-date' });

    const { body: data } = await api()
      .post('/entries')
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors[0].path).toEqual(['when']);
    expect(data.errors[0].message).toBe('Informe uma data');
  });

  it('[Create] - Deve falhar ao tentar cadastrar um lançamento utilizando uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const body = EntryHelper.generatePayload({
      category: { id: $faker.string.uuid() },
    });

    const { body: data } = await api()
      .post('/entries')
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Categoria não encontrada');
  });

  it('[Update] - Deve ser capaz de atualizar um lançamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const randomEntry = await EntryHelper.getOne(token);

    const body = EntryHelper.generatePayload();

    const { body: data } = await api()
      .put(`/entries/${randomEntry.id}`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.entry.id).toBe(randomEntry.id);
    expect(data.entry.type).toBe(body.type);
    expect(data.entry.amount).toBe(body.amount);
    expect(data.entry.description).toBe(body.description);
    expect(data.entry.when).toBe(body.when);
  });

  it('[Update] - Deve falhar ao tentar atualizar um lançamento que não existe', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const body = EntryHelper.generatePayload();

    const { body: data } = await api()
      .put(`/entries/${$faker.string.uuid()}`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(data.message).toBe('Lançamento não encontrado');
  });

  it('[Update] - Deve falhar ao tentar atualizar um lançamento caso ele pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const randomUserOneEntry = await EntryHelper.getOne(userOneToken);

    const body = EntryHelper.generatePayload();

    const { body: data } = await api()
      .put(`/entries/${randomUserOneEntry.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .send(body)
      .expect(404);

    expect(data.message).toBe('Lançamento não encontrado');
  });

  it('[Remove] - Deve ser capaz de remover um lançamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const randomEntry = await EntryHelper.getOne(token);

    await api()
      .delete(`/entries/${randomEntry.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api()
      .get(`/entries/${randomEntry.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover um lançamento inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    await api()
      .delete(`/entries/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover um lançamento caso ele pertença a outro usuário', async () => {
    const users = await UserHelper.getManySubscribed();
    const userOne = users[0];
    const userTwo = users[1];

    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const randomUserOneEntry = await EntryHelper.getOne(userOneToken);

    await api()
      .delete(`/entries/${randomUserOneEntry.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);
  });

  it('[Bulk Create] - Deve ser capaz de cadastrar vários lançamentos em lote', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const entriesToCreate = [
      EntryHelper.generatePayload(),
      EntryHelper.generatePayload(),
      EntryHelper.generatePayload(),
    ];

    const { body: data } = await api()
      .post('/entries/bulk')
      .send({ entries: entriesToCreate })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.entries).toBeTruthy();
    expect(data.entries.length).toBe(3);

    for (const entry of data.entries) {
      expect(entry.id).toBeTruthy();
      expect(entry.userId).toBe(user.id);
    }
  });

  it('[Bulk Create] - Deve falhar ao tentar cadastrar lançamentos em lote caso algum valor seja inválido', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const entriesToCreate = [
      EntryHelper.generatePayload(),
      EntryHelper.generatePayload({ amount: -10 }),
    ];

    const { body: data } = await api()
      .post('/entries/bulk')
      .send({ entries: entriesToCreate })
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(data.errors).toBeTruthy();
  });

  it('[Smart Extract] - Deve ser capaz de extrair lançamentos de um texto', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .post('/entries/smart-extract')
      .send({
        text: "Comprei um lanche no McDonald's por 35.50",
        now: new Date().toISOString(),
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(data.entries).toBeTruthy();
    expect(data.entries.length).toBeGreaterThan(0);
    expect(data.entries[0]).toHaveProperty('amount');
    expect(data.entries[0].amount).toBeGreaterThan(0);
  });

  it('[Smart Extract] - Deve falhar ao tentar extrair lançamentos caso o texto não seja enviado ou seja vazio', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .post('/entries/smart-extract')
      .send({
        now: new Date().toISOString(),
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(data.message).toBe('Me diga o que aconteceu, ou envie um áudio ou imagem!');
  });
});
