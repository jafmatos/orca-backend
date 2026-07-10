import { UserHelper } from '@Test/helpers/user.helper';
import { api } from '@Test/helpers/api.helper';
import { $constants } from '@Test/constants';
import { $faker } from '@Test/helpers/$faker';

describe('Auth > sign-in (e2e)', () => {
  it('[Create] - Deve ser capaz de acessar a conta com email e senha', async () => {
    const user = await UserHelper.getOneByRole('user');
    const response = await api()
      .post('/sign-in')
      .send({
        email: user.email,
        password: $constants.defaultUserPassword,
      })
      .expect(201);

    expect(response.body.token).toBeTruthy();
    expect(response.body.user).toBeTruthy();
    expect(response.body.user.id).toBeTruthy();
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.createdAt).toBeTruthy();
    expect(response.body.user.updatedAt).toBeTruthy();
    expect(response.body.user.currentCycle).toBeTruthy();
    expect(response.body.user.currentCycle.start).toBeTruthy();
    expect(response.body.user.currentCycle.end).toBeTruthy();
  });

  it('[Create] - Deve falhar ao tentar acessar a conta caso o email esteja em formato incorreto', async () => {
    const response = await api()
      .post('/sign-in')
      .send({
        email: 'this is not an email',
        password: 'secret',
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0].path[0]).toBe('email');
    expect(response.body.errors[0].message).toBe('Email inválido');
  });

  it('[Create] - Deve falhar ao tentar acessar a conta caso o email não tenha sido confirmado ainda', async () => {
    const unconfirmedEmail = $faker.internet.email();
    const unconfirmedPassword = $constants.defaultUserPassword;

    await api().post('/sign-up').send({
      acceptedTerms: true,
      email: unconfirmedEmail,
      name: $faker.person.fullName(),
      password: unconfirmedPassword,
      passwordConfirmation: unconfirmedPassword,
      confirmUrl: $faker.internet.url(),
    });

    const response = await api()
      .post('/sign-in')
      .send({
        email: unconfirmedEmail,
        password: unconfirmedPassword,
      })
      .expect(409);

    expect(response.body.message).toBe(
      'Você precisa confirmar o E-mail antes de acessar sua conta. Verifique sua caixa de entrada!',
    );
  });

  it('[Create] - Deve falhar ao tentar acessar a conta caso o email esteja incorreto', async () => {
    const response = await api()
      .post('/sign-in')
      .send({
        email: 'unexistingvalidemail@gmail.com',
        password: 'secret',
      })
      .expect(418);

    expect(response.body.message).toBe('E-mail ou senha incorretos');
  });

  it('[Create] - Deve falhar ao tentar acessar a conta caso a senha esteja incorreta', async () => {
    const user = await UserHelper.getOneByRole('user');
    const response = await api()
      .post('/sign-in')
      .send({
        email: user.email,
        password: 'incorrectpassword',
      })
      .expect(418);

    expect(response.body.message).toBe('E-mail ou senha incorretos');
  });

  it('[Show] - Deve retornar o usuário autenticado pelo token', async () => {
    const { email } = await UserHelper.getOneByRole('user');
    const signInResponse = await api()
      .post('/sign-in')
      .send({
        email,
        password: $constants.defaultUserPassword,
      })
      .expect(201);

    const token = signInResponse.body.token;

    const response = await api()
      .get('/sign-in')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const user = response.body.user;

    expect(user).toBeTruthy();
    expect(user.id).toBeTruthy();
    expect(user.email).toBe(email);
    expect(user.name).not.toBeNull();
    expect(user.createdAt).toBeTruthy();
    expect(user.updatedAt).toBeTruthy();
    expect(user.currentCycle).toBeTruthy();
    expect(user.currentCycle.start).toBeTruthy();
    expect(user.currentCycle.end).toBeTruthy();
  });

  it('[Show] - Deve falhar ao tentar retornar o usuário sem enviar o token', async () => {
    await api().get('/sign-in').expect(401);
  });

  it('[Show] - Deve falhar ao tentar retornar o usuário enviando um token com formato inválido', async () => {
    await api()
      .get('/sign-in')
      .set('Authorization', 'Bearer tokenwithinvalidformat')
      .expect(401);
  });
});
