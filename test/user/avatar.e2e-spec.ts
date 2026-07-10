import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';
import { BufferHelper } from '@Test/helpers/buffer.helper';
import { $faker } from '@Test/helpers/$faker';

describe('User > avatar (e2e)', () => {
  it('[Update] - Deve ser capaz de adicionar uma foto de perfil', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const buffer = BufferHelper.getBuffer(1);

    const response = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buffer, {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    expect(response.body.user).toBeTruthy();
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.createdAt).toBeTruthy();
    expect(response.body.user.updatedAt).toBeTruthy();
    expect(response.body.user.avatar).toBeTruthy();
    expect(response.body.user.avatar.fileName).toContain('.jpeg');
  });

  it('[Update] - Deve ser capaz de atualizar a foto de perfil', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const buffer = BufferHelper.getBuffer(1);

    const oldResponse = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buffer, {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    const oldAvatar = oldResponse.body.user.avatar;

    const newResponse = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buffer, {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    const newAvatar = newResponse.body.user.avatar;

    expect(newAvatar).toBeTruthy();
    expect(newAvatar.fileName).not.toBe(oldAvatar.fileName);
  });

  it('[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil caso o usuário não esteja autenticado', async () => {
    await api()
      .put('/users/me/avatar')
      .attach('avatar', BufferHelper.getBuffer(1), {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(401);
  });

  it('[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil sem enviar uma imagem', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);

    const response = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.message).toBe('É necessário enviar uma imagem');
  });

  it('[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil enviando um arquivo que não é uma imagem', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);

    const response = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', BufferHelper.getBuffer(1), {
        filename: 'avatar.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(response.body.message).toBe('É necessário enviar uma imagem');
  });

  it('[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil enviando uma imagem maior que 5MB de tamanho', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const sizeInMB = $faker.number.float({ min: 5.1, max: 10 });

    const response = await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', BufferHelper.getBuffer(sizeInMB), {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(response.body.message).toBe('Imagem muito grande. Limite: 5MB');
  });

  it('[Delete] - Deve ser capaz de remover a foto de perfil', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const buffer = BufferHelper.getBuffer(1);

    await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buffer, {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    const response = await api()
      .delete('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toBeTruthy();
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.avatar).toBeUndefined();
  });

  it('[Delete] - Deve falhar ao tentar remover a foto de perfil caso o usuário não esteja autenticado', async () => {
    const user = await UserHelper.getOneByRole('user');
    const token = await AuthHelper.signIn(user);
    const buffer = BufferHelper.getBuffer(1);

    await api()
      .put('/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', buffer, {
        filename: 'avatar.jpeg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    await api().delete('/users/me/avatar').expect(401);
  });
});
