import { AuthHelper } from '../helpers/auth.helper';
import { api } from '../helpers/api.helper';
import { faker } from '@faker-js/faker';
import { UserHelper } from '../helpers/user.helper';
import { $constants } from '../constants';

describe('Auth > reset-password (e2e)', () => {
  it('[Create] - Deve ser capaz de iniciar a recuperação de senha', async () => {
    const user = await UserHelper.getOneByRole('user');
    const response = await api()
      .post('/reset-password')
      .send({
        email: user.email,
        confirmUrl: faker.internet.url(),
      })
      .expect(201);

    expect(response.body.key).toBeTruthy();
    expect(response.body.key.id).toBeTruthy();
    expect(response.body.key.otp).toBeTruthy();
    expect(response.body.key.userId).toBeTruthy();
    expect(response.body.key.expiresAt).toBeTruthy();
    expect(response.body.key.type).toBe('reset-password');
  });

  it('[Create] - Deve falhar ao tentar iniciar a recuperação de senha caso o usuário tente utilizar um email com formato inválido', async () => {
    const response = await api()
      .post('/reset-password')
      .send({
        email: 'invalidemail',
        confirmUrl: faker.internet.url(),
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors[0].path[0]).toBe('email');
    expect(response.body.errors[0].message).toBe('Email inválido');
  });

  it('[Create] - Deve falhar ao tentar iniciar a recuperação de senha caso o usuário tente usar um email que não existe no sistema', async () => {
    const response = await api()
      .post('/reset-password')
      .send({
        email: faker.internet.email(),
        confirmUrl: faker.internet.url(),
      })
      .expect(404);

    expect(response.body.message).toBe('Não existe uma conta com este E-mail');
  });

  it('[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação', async () => {
    const user = await UserHelper.getOneByRole('user');
    const initialKey = await AuthHelper.initiateResetPassword(user);

    const resendResponse = await api()
      .put(`/reset-password/resend/${initialKey.id}`)
      .send({
        confirmUrl: faker.internet.url(),
      })
      .expect(200);

    const updatedKey = resendResponse.body.key;

    expect(updatedKey).toBeTruthy();
    expect(updatedKey.id).toBeTruthy();
    expect(updatedKey.otp).toBeTruthy();
    expect(updatedKey.userId).toBeTruthy();
    expect(updatedKey.expiresAt).toBeTruthy();
    expect(updatedKey.type).toBe('reset-password');
    expect(updatedKey.otp).not.toBe(initialKey.otp);
    expect(updatedKey.expiresAt).not.toBe(initialKey.expiresAt);
  });

  it('[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente', async () => {
    const response = await api()
      .put(`/reset-password/resend/${faker.string.uuid()}`)
      .send({
        confirmUrl: faker.internet.url(),
      })
      .expect(404);

    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Update] - Deve ser capaz de finalizar a recuperação de senha', async () => {
    const user = await UserHelper.getOneByRole('user');
    const key = await AuthHelper.initiateResetPassword(user);
    const newPassword = faker.internet.password({ length: 12 });

    const response = await api()
      .put(`/reset-password/${key.id}`)
      .send({
        otp: $constants.defaultOtpCode,
        password: newPassword,
        passwordConfirmation: newPassword,
      })
      .expect(200);

    expect(response.body.user).toBeTruthy();
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.createdAt).toBeTruthy();
    expect(response.body.user.updatedAt).toBeTruthy();
    expect(response.body.token).toBeTruthy();

    await AuthHelper.resetPassword(user, $constants.defaultUserPassword);
  });

  it('[Update] - Deve ser capaz de acessar a conta utilizando a nova senha', async () => {
    const user = await UserHelper.getOneByRole('user');
    const newPassword = faker.internet.password({ length: 12 });

    await AuthHelper.resetPassword(user, newPassword);

    const signInResponse = await api()
      .post('/sign-in')
      .send({
        email: user.email,
        password: newPassword,
      })
      .expect(201);

    expect(signInResponse.body.token).toBeTruthy();

    await AuthHelper.resetPassword(user, $constants.defaultUserPassword);
  });

  it('[Update] - Deve falhar ao tentar finalizar a recuperação de senha utilizando um código incorreto', async () => {
    const user = await UserHelper.getOneByRole('user');
    const key = await AuthHelper.initiateResetPassword(user);
    const newPassword = faker.internet.password({ length: 12 });

    const response = await api()
      .put(`/reset-password/${key.id}`)
      .send({
        otp: '999999',
        password: newPassword,
        passwordConfirmation: newPassword,
      })
      .expect(401);

    expect(response.body.message).toBe('Código incorreto ou expirado');
  });

  it('[Update] - Deve falhar ao tentar finalizar a recuperação de senha utilizando uma chave inexistente', async () => {
    const newPassword = faker.internet.password({ length: 12 });

    const response = await api()
      .put(`/reset-password/${faker.string.uuid()}`)
      .send({
        otp: $constants.defaultOtpCode,
        password: newPassword,
        passwordConfirmation: newPassword,
      })
      .expect(404);

    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Update] - Deve falhar ao tentar finalizar a recuperação de senha caso a confirmação da nova senha esteja incorreta', async () => {
    const user = await UserHelper.getOneByRole('user');
    const key = await AuthHelper.initiateResetPassword(user);
    const newPassword = faker.internet.password({ length: 12 });

    const response = await api()
      .put(`/reset-password/${key.id}`)
      .send({
        otp: $constants.defaultOtpCode,
        password: newPassword,
        passwordConfirmation: 'wrong' + newPassword,
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors[0]).toBeTruthy();
    expect(response.body.errors[0].path[0]).toBe('passwordConfirmation');
    expect(response.body.errors[0].message).toBe('Confirmação incorreta');
  });

  it('[Update] - Deve falhar ao tentar finalizar a recuperação de senha caso a nova senha tenha menos de 6 caracteres', async () => {
    const user = await UserHelper.getOneByRole('user');
    const key = await AuthHelper.initiateResetPassword(user);
    const newPassword = 'ab123';

    const response = await api()
      .put(`/reset-password/${key.id}`)
      .send({
        otp: $constants.defaultOtpCode,
        password: newPassword,
        passwordConfirmation: newPassword,
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors[0]).toBeTruthy();
    expect(response.body.errors[0].path[0]).toBe('password');
    expect(response.body.errors[0].message).toBe('Senha curta demais');
  });
});
