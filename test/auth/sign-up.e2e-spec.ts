import { api } from '../helpers/api.helper';
import { AuthHelper } from '../helpers/auth.helper';
import { faker } from '@faker-js/faker';
import { $constants } from '../constants';

describe('Auth > sign-up (e2e)', () => {
  it('[Create] - Deve ser capaz de iniciar o cadastro', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email: defaultUserEmail,
        name: faker.person.fullName(),
        password: defaultPassword,
        passwordConfirmation: defaultPassword,
        confirmUrl: faker.internet.url(),
      })
      .expect(201);

    expect(response.body.key).toBeTruthy();
    expect(response.body.key.id).toBeTruthy();
    expect(response.body.key.userId).toBeTruthy();
    expect(response.body.key.expiresAt).toBeTruthy();
    expect(response.body.key.type).toBe('sign-up');
  });

  it('[Create] - Deve gerar uma nova chave de acesso quando o usuário tentar se cadastrar com um email que já existe e não está confirmado', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const body = {
      acceptedTerms: true,
      email: defaultUserEmail,
      name: faker.person.fullName(),
      password: defaultPassword,
      passwordConfirmation: defaultPassword,
      confirmUrl: faker.internet.url(),
    };

    const responseOld = await api().post('/sign-up').send(body).expect(201);
    const dataOld = responseOld.body;

    const responseNew = await api().post('/sign-up').send(body).expect(201);
    const dataNew = responseNew.body;

    expect(dataNew.key.id).not.toBe(dataOld.key.id);
    expect(dataNew.key.expiresAt).not.toBe(dataOld.key.expiresAt);
    expect(dataNew.key.userId).toBe(dataOld.key.userId);
    expect(dataNew.key.type).toBe('sign-up');
  });

  it('[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente utilizar um email com formato incorreto', async () => {
    const defaultPassword = $constants.defaultUserPassword;
    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email: 'invalid value for email',
        name: faker.person.fullName(),
        password: defaultPassword,
        passwordConfirmation: defaultPassword,
        confirmUrl: faker.internet.url(),
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0].path[0]).toBe('email');
  });

  it('[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente usar um email que já existe e está confirmado', async () => {
    const user = await AuthHelper.signUp();
    const defaultPassword = $constants.defaultUserPassword;

    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email: user.email,
        name: user.name,
        password: defaultPassword,
        passwordConfirmation: defaultPassword,
        confirmUrl: faker.internet.url(),
      })
      .expect(409);

    expect(response.body.message).toBe('Este e-mail já está em uso');
  });

  it('[Create] - Deve falhar ao tentar iniciar o cadastro caso a confirmação da senha esteja incorreta', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email: defaultUserEmail,
        name: faker.person.fullName(),
        password: defaultPassword,
        passwordConfirmation: defaultPassword + 'wrongpass',
        confirmUrl: faker.internet.url(),
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0].path[0]).toBe('passwordConfirmation');
    expect(response.body.errors[0].message).toBe('Confirmação incorreta');
  });

  it('[Create] - Deve falhar ao tentar iniciar o cadastro caso a senha tenha menos de 6 caracteres', async () => {
    const defaultUserEmail = faker.internet.email();
    const password = 'ab123';

    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email: defaultUserEmail,
        name: faker.person.fullName(),
        password: password,
        passwordConfirmation: password,
        confirmUrl: faker.internet.url(),
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors[0].path[0]).toBe('password');
    expect(response.body.errors[0].message).toBe('Senha curta demais');
  });

  it('[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário não aceite os termos de uso', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const response = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: false,
        email: defaultUserEmail,
        name: faker.person.fullName(),
        password: defaultPassword,
        passwordConfirmation: defaultPassword,
        confirmUrl: faker.internet.url(),
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0].path[0]).toBe('acceptedTerms');
    expect(response.body.errors[0].message).toBe(
      'É necessário aceitar os termos de uso',
    );
  });

  it('[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const body = {
      acceptedTerms: true,
      email: defaultUserEmail,
      name: faker.person.fullName(),
      password: defaultPassword,
      passwordConfirmation: defaultPassword,
      confirmUrl: faker.internet.url(),
    };

    const responseOld = await api().post('/sign-up').send(body).expect(201);
    const dataOld = responseOld.body;

    const responseNew = await api()
      .put(`/sign-up/resend/${dataOld.key.id}`)
      .send({ confirmUrl: faker.internet.url() })
      .expect(200);
    const dataNew = responseNew.body;

    expect(dataNew.key.id).toBe(dataOld.key.id);
    expect(dataNew.key.expiresAt).not.toBe(dataOld.key.expiresAt);
    expect(dataNew.key.userId).toBe(dataOld.key.userId);
    expect(dataNew.key.type).toBe('sign-up');
  });

  it('[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente', async () => {
    const response = await api()
      .put(`/sign-up/resend/${faker.string.uuid()}`)
      .send({ confirmUrl: faker.internet.url() })
      .expect(404);
    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Update] - Deve ser capaz de finalizar o cadastro', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const body = {
      acceptedTerms: true,
      email: defaultUserEmail,
      name: faker.person.fullName(),
      password: defaultPassword,
      passwordConfirmation: defaultPassword,
      confirmUrl: faker.internet.url(),
    };

    const createResponse = await api().post('/sign-up').send(body).expect(201);
    const key = createResponse.body.key;

    const confirmResponse = await api()
      .put(`/sign-up/${key.id}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(200);

    expect(confirmResponse.body.token).toBeTruthy();
    expect(confirmResponse.body.user).toBeTruthy();
  });

  it('[Update] - Deve falhar ao tentar finalizar o cadastro utilizando uma chave inexistente', async () => {
    const response = await api()
      .put(`/sign-up/${faker.string.uuid()}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(404);

    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Update] - Deve falhar ao tentar finalizar o cadastro utilizando um código incorreto', async () => {
    const defaultUserEmail = faker.internet.email();
    const defaultPassword = $constants.defaultUserPassword;
    const body = {
      acceptedTerms: true,
      email: defaultUserEmail,
      name: faker.person.fullName(),
      password: defaultPassword,
      passwordConfirmation: defaultPassword,
      confirmUrl: faker.internet.url(),
    };

    const createResponse = await api().post('/sign-up').send(body).expect(201);

    const confirmResponse = await api()
      .put(`/sign-up/${createResponse.body.key.id}`)
      .send({
        otp: '999999',
      })
      .expect(401);

    expect(confirmResponse.body.message).toBe('Código incorreto ou expirado');
  });
});
