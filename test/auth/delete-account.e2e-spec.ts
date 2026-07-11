import { api } from '@Test/helpers/api.helper';
import { UserHelper } from '@Test/helpers/user.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { $constants } from '@Test/constants';
import { $faker } from '@Test/helpers/$faker';

describe('Auth > delete-account (e2e)', () => {
  it('[Create] - Deve ser capaz de iniciar a exclusão da conta', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);

    const response = await api()
      .post('/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(201);

    expect(response.body.key).toBeTruthy();
    expect(response.body.key.id).toBeTruthy();
    expect(response.body.key.otp).toBeTruthy();
    expect(response.body.key.userId).toBeTruthy();
    expect(response.body.key.expiresAt).toBeTruthy();
    expect(response.body.key.type).toBe('delete-account');
  });

  it('[Create] - Deve falhar ao tentar iniciar a exclusão da conta caso o usuário não esteja autenticado', async () => {
    await api()
      .post('/delete-account')
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(401);
  });

  it('[Create] - Deve falhar ao tentar iniciar a exclusão da conta caso o usuário autenticado seja um administrador', async () => {
    const admin = await UserHelper.getOneByRole('admin');
    const token = await AuthHelper.signIn(admin);
    const response = await api()
      .post('/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(403);

    expect(response.body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Create] - Deve falhar ao tentar iniciar a exclusão da conta caso o usuário autenticado seja um super usuário', async () => {
    const superUser = await UserHelper.getOneByRole('super-user');
    const token = await AuthHelper.signIn(superUser);
    const response = await api()
      .post('/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(403);

    expect(response.body.message).toBe(
      'Você não tem permissão para acessar este recurso',
    );
  });

  it('[Create] - Deve falhar ao tentar iniciar a exclusão da conta utilizando uma url de retorno inválida', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const response = await api()
      .post('/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: 'notanurl',
      })
      .expect(422);

    expect(response.body.errors).toBeTruthy();
    expect(response.body.errors[0].path[0]).toBe('confirmUrl');
    expect(response.body.errors[0].message).toBe('URL inválida');
  });

  it('[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const initialKey = await AuthHelper.initiateDeleteAccount(user, token);

    const resendResponse = await api()
      .put(`/delete-account/resend/${initialKey.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(200);

    const updatedKey = resendResponse.body.key;

    expect(updatedKey).toBeTruthy();
    expect(updatedKey.id).toBeTruthy();
    expect(updatedKey.otp).toBeTruthy();
    expect(updatedKey.userId).toBeTruthy();
    expect(updatedKey.expiresAt).toBeTruthy();
    expect(updatedKey.type).toBe('delete-account');
    expect(updatedKey.otp).not.toBe(initialKey.otp);
    expect(updatedKey.expiresAt).not.toBe(initialKey.expiresAt);
  });

  it('[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const response = await api()
      .put(`/delete-account/resend/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(404);

    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Resend] - Deve falhar ao tentar reenviar o email caso o usuário não esteja autenticado', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const initialKey = await AuthHelper.initiateDeleteAccount(user, token);

    await api()
      .put(`/delete-account/resend/${initialKey.id}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(401);
  });

  it('[Update] - Deve ser capaz de finalizar a exclusão da conta', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const key = await AuthHelper.initiateDeleteAccount(user, token);

    const response = await api()
      .put(`/delete-account/${key.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(200);

    expect(response.body.message).toBe('Conta excluída com sucesso');
  });

  it('[Update] - Deve falhar ao tentar fazer login depois de finalizar a exclusão da conta', async () => {
    const user = await UserHelper.getOneByRole('user');

    await AuthHelper.deleteAccount(user);

    const response = await api()
      .post('/sign-in')
      .send({
        email: user.email,
        password: $constants.defaultUserPassword,
      })
      .expect(418);

    expect(response.body.message).toBe('E-mail ou senha incorretos');
  });

  it('[Update] - Deve falhar ao tentar finalizar a exclusão da conta utilizando uma chave inexistente', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);

    const response = await api()
      .put(`/delete-account/${$faker.string.uuid()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(404);

    expect(response.body.message).toBe('Chave de acesso não encontrada');
  });

  it('[Update] - Deve falhar ao tentar finalizar a exclusão da conta caso o usuário não esteja autenticado', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const key = await AuthHelper.initiateDeleteAccount(user, token);

    await api()
      .put(`/delete-account/${key.id}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(401);
  });
});
