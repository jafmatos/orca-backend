import { EntryTypes } from '@/common/enums/entry-types.enum';
import { ScheduleFrequency } from '@/schedule/entities/schedule.entity';
import { $faker } from '@Test/helpers/$faker';
import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { ScheduleHelper } from '@Test/helpers/schedule.helper';
import { UserHelper } from '@Test/helpers/user.helper';

describe('Schedules (e2e)', () => {
  const expectedScheduleShape = {
    id: expect.any(String),
    userId: expect.any(String),
    type: expect.any(String),
    amount: expect.any(Number),
    description: expect.any(String),
    frequency: expect.any(String),
    time: expect.any(String),
    timezone: expect.any(String),
    createdAt: expect.any(String),
    cycles: expect.any(Array),
  };

  it('[List] - Deve ser capaz de listar os agendamentos sem paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get('/schedules?paginated=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data[0]).toMatchObject(expectedScheduleShape);
  });

  it('[List] - Deve ser capaz de listar os agendamentos usando paginação', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body: data } = await api()
      .get('/schedules?paginated=true&page=1&perPage=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.meta.count).toBeDefined();
    expect(data.meta.pages).toBeDefined();
    expect(data.meta.page).toBe(1);
    expect(data.meta.perPage).toBe(5);
  });

  it('[List] - Deve falhar ao tentar listar os agendamentos caso o usuário não esteja autenticado', async () => {
    await api().get('/schedules').expect(401);
  });

  it('[Show] - Deve ser capaz de encontrar um agendamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const { body: data } = await api()
      .get(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(data.schedule).toMatchObject({
      ...expectedScheduleShape,
      id: schedule.id,
      amount: schedule.amount,
      description: schedule.description,
      type: schedule.type,
      frequency: schedule.frequency,
    });
  });

  it('[Show] - Deve falhar ao tentar encontrar um agendamento inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    await api()
      .get(`/schedules/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Show] - Deve falhar ao tentar encontrar um agendamento caso ele pertença a outro usuário', async () => {
    const [userOne, userTwo] = await UserHelper.getManySubscribed();
    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const schedule = await ScheduleHelper.getOne(userOneToken);

    await api()
      .get(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);
  });

  it('[Create] - Deve ser capaz de cadastrar um agendamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: parseFloat($faker.finance.amount({ min: 10, max: 1000 })),
      description: $faker.lorem.words(3).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: data } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    expect(data.schedule).toMatchObject({
      ...expectedScheduleShape,
      description: body.description,
      amount: body.amount,
      frequency: body.frequency,
      type: body.type,
    });
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso o usuário não esteja autenticado', async () => {
    await api().post('/schedules').send({}).expect(401);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso o valor seja menor do que zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: -15,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['amount']);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso o horário seja inválido', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '25:00',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['time']);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso a descrição seja maior que 60 caracteres', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.string.alpha(61),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['description']);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso o dia da semana esteja inválido (domingo = 0, sábado = 6)', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      frequency: ScheduleFrequency.Weekly,
      dayOfWeek: 8,
    };

    const { body: response } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['dayOfWeek']);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento caso o dia do mês esteja inválido (válido: 1 - 28)', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 29,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['dayOfMonth']);
  });

  it('[Create] - Deve falhar ao tentar cadastrar um agendamento utilizando uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const body = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
      category: {
        id: $faker.string.uuid(),
      },
    };

    await api()
      .post('/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(404);
  });

  it('[Update] - Deve ser capaz de atualizar um agendamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: EntryTypes.Income,
      amount: parseFloat($faker.finance.amount({ min: 10, max: 1000 })),
      description: $faker.lorem.words(3).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      frequency: ScheduleFrequency.Weekly,
      dayOfWeek: 1,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(200);

    expect(response.schedule).toMatchObject({
      ...expectedScheduleShape,
      amount: updateBody.amount,
      description: updateBody.description,
      type: updateBody.type,
      frequency: updateBody.frequency,
      dayOfWeek: updateBody.dayOfWeek,
    });
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const updateBody = {
      type: EntryTypes.Expense,
      amount: 500,
      description: $faker.lorem.words(3).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    await api()
      .put(`/schedules/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(404);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento caso o valor seja menor do que zero', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: EntryTypes.Expense,
      amount: -5,
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['amount']);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento caso o horário seja inválido', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.lorem.words(2).slice(0, 60),
      time: 'invalid',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['time']);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento caso a descrição seja maior que 60 caracteres', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: EntryTypes.Expense,
      amount: 100,
      description: $faker.string.alpha(61),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['description']);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento caso o dia da semana esteja inválido (domingo = 0, sábado = 6)', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: $faker.helpers.arrayElement(Object.values(EntryTypes)),
      amount: $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      frequency: ScheduleFrequency.Weekly,
      dayOfWeek: 12,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['dayOfWeek']);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento caso o dia do mês esteja inválido (válido: 1 - 28)', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: $faker.helpers.arrayElement(Object.values(EntryTypes)),
      amount: $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 29,
      frequency: ScheduleFrequency.Monthly,
    };

    const { body: response } = await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(422);

    expect(response.errors[0].path).toStrictEqual(['dayOfMonth']);
  });

  it('[Update] - Deve falhar ao tentar atualizar um agendamento utilizando uma categoria inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    const updateBody = {
      type: $faker.helpers.arrayElement(Object.values(EntryTypes)),
      amount: $faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      description: $faker.lorem.words(2).slice(0, 60),
      time: '14:30',
      timezone: 'America/Sao_Paulo',
      dayOfMonth: 15,
      frequency: ScheduleFrequency.Monthly,
      category: {
        id: $faker.string.uuid(),
      },
    };

    await api()
      .put(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBody)
      .expect(404);
  });

  it('[Remove] - Deve ser capaz de remover um agendamento', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);
    const schedule = await ScheduleHelper.getOne(token);

    await api()
      .delete(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api()
      .get(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover um agendamento inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    await api()
      .delete(`/schedules/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('[Remove] - Deve falhar ao tentar remover um agendamento caso ele pertença a outro usuário', async () => {
    const [userOne, userTwo] = await UserHelper.getManySubscribed();
    const userOneToken = await AuthHelper.signIn(userOne);
    const userTwoToken = await AuthHelper.signIn(userTwo);
    const schedule = await ScheduleHelper.getOne(userOneToken);

    await api()
      .delete(`/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${userTwoToken}`)
      .expect(404);
  });
});
