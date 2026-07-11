import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';
import { $faker } from '@Test/helpers/$faker';

describe('User > account (e2e)', () => {
  it('[Update] - Deve ser capaz de atualizar os dados da conta', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      name: $faker.person.fullName(),
      salaryDay: $faker.number.int({ min: 1, max: 28 }),
      acceptsNotifications: $faker.datatype.boolean(),
    };

    const response = await api()
      .put('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(response.body.user).toBeTruthy();
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.createdAt).toBeTruthy();
    expect(response.body.user.updatedAt).toBeTruthy();
    expect(response.body.user.currentCycle).toBeTruthy();
    expect(response.body.user.currentCycle.start).toBeTruthy();
    expect(response.body.user.currentCycle.end).toBeTruthy();
    expect(response.body.user.name).toBe(payload.name);
    expect(response.body.user.salaryDay).toBe(payload.salaryDay);
    expect(response.body.user.acceptsNotifications).toBe(
      payload.acceptsNotifications,
    );
  });

  it('[Update] - Deve falhar ao tentar atualizar os dados da conta caso o usuário não esteja autenticado', async () => {
    await api()
      .put('/users/me')
      .send({
        name: $faker.person.fullName(),
      })
      .expect(401);
  });
});
