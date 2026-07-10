import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';
import { $faker } from '@Test/helpers/$faker';

describe('Push Subscriptions (e2e)', () => {
  it('[Create] - Deve ser capaz de cadastrar uma push subscription webpush', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      provider: 'webpush',
      endpoint: `https://fcm.googleapis.com/fcm/send/${$faker.string.uuid()}`,
      keys: {
        p256dh: 'BMp256dhKeySomeStringExampleValueHereJustForTesting',
        auth: 'authKeySomeStringExampleValueHereJustForTesting',
      },
    };

    const { body } = await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(body.message).toBe('Assinatura cadastrada com sucesso');
  });

  it('[Create] - Deve ser capaz de cadastrar uma push subscription expo', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      provider: 'expo',
      expoPushToken: `ExponentPushToken[${$faker.string.uuid()}]`,
      platform: 'android',
    };

    const { body } = await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(body.message).toBe('Assinatura cadastrada com sucesso');
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma push subscription com provider repetido para o mesmo usuário', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      provider: 'expo',
      expoPushToken: `ExponentPushToken[${$faker.string.uuid()}]`,
    };

    await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const { body } = await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400); 

    expect(body.message).toBe('Assinatura já cadastrada');
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma push subscription webpush caso o usuário não esteja autenticado', async () => {
    const payload = {
      provider: 'webpush',
      endpoint: `https://fcm.googleapis.com/fcm/send/${$faker.string.uuid()}`,
      keys: {
        p256dh: 'BMp256dhKeySomeStringExampleValueHereJustForTesting',
        auth: 'authKeySomeStringExampleValueHereJustForTesting',
      },
    };

    await api().post('/push-subscriptions').send(payload).expect(401);
  });

  it('[Create] - Deve falhar ao tentar cadastrar uma push subscription expo caso o usuário não esteja autenticado', async () => {
    const payload = {
      provider: 'expo',
      expoPushToken: `ExponentPushToken[${$faker.string.uuid()}]`,
    };

    await api().post('/push-subscriptions').send(payload).expect(401);
  });

  it('[Remove] - Deve ser capaz de remover uma push subscription webpush', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      provider: 'webpush',
      endpoint: `https://fcm.googleapis.com/fcm/send/${$faker.string.uuid()}`,
      keys: {
        p256dh: 'BMp256dhKeySomeStringExampleValueHereJustForTesting',
        auth: 'authKeySomeStringExampleValueHereJustForTesting',
      },
    };

    await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const { body } = await api()
      .delete('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .query({ provider: payload.provider, endpoint: payload.endpoint })
      .expect(200);

    expect(body.message).toBe('Assinatura removida com sucesso');
  });

  it('[Remove] - Deve ser capaz de remover uma push subscription expo', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const payload = {
      provider: 'expo',
      expoPushToken: `ExponentPushToken[${$faker.string.uuid()}]`,
    };

    await api()
      .post('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const { body } = await api()
      .delete('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .query({
        provider: payload.provider,
        expoPushToken: payload.expoPushToken,
      })
      .expect(200);

    expect(body.message).toBe('Assinatura removida com sucesso');
  });

  it('[Remove] - Deve falhar ao tentar remover uma push subscription inexistente', async () => {
    const user = await UserHelper.getOneSubscribed('user');
    const token = await AuthHelper.signIn(user);

    const { body } = await api()
      .delete('/push-subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .query({
        provider: 'expo',
        expoPushToken: 'ExponentPushToken[InvalidToken]',
      })
      .expect(404);

    expect(body.message).toBe('Assinatura não encontrada');
  });

  it('[Remove] - Deve falhar ao tentar remover uma push subscription caso o usuário não esteja autenticado', async () => {
    await api()
      .delete('/push-subscriptions')
      .query({ provider: 'expo', expoPushToken: 'ExponentPushToken[Token]' })
      .expect(401);
  });
});
