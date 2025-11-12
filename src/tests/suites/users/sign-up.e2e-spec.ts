import { expect, test } from "@jest/globals";
import { userFactory } from "Tests/api/Factories/UserFactory";
import { SignUpCreateBody } from "Tests/api/Requests/Users/SignUp.api";
import { dataProvider } from "Tests/data/Providers/dataProvider";
import { DEFAULT_TESTING_OTP } from "Tests/variables";
import { KeyTypes } from "Tests/api/Models";
import { api } from "Tests/api/Requests";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Users > sign-up", () => {
  test("[Create] - Deve ser capaz de iniciar o cadastro", async () => {
    const generatedUser = userFactory.one();

    const { body: data } = await api.users.signUp
      .create({
        acceptedTerms: true,
        email: generatedUser.email,
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password,
        confirmUrl: dataProvider.url(),
      })
      .expect(200);

    expect(data.key).toBeTruthy();
    expect(data.key.id).toBeTruthy();
    expect(data.key.otp).toBeTruthy();
    expect(data.key.userId).toBeTruthy();
    expect(data.key.expiresAt).toBeTruthy();
    expect(data.key.type).toBe(KeyTypes.SignUp);
  });

  test("[Create] - Deve gerar uma nova chave de acesso quando o usuário tentar se cadastrar com um email que já existe e não está confirmado", async () => {
    const generatedUser = userFactory.one();
    const body: SignUpCreateBody = {
      acceptedTerms: true,
      email: generatedUser.email,
      name: generatedUser.name,
      password: generatedUser.password,
      passwordConfirmation: generatedUser.password,
      confirmUrl: dataProvider.url(),
    };

    const { body: dataOld } = await api.users.signUp.create(body).expect(200);
    const { body: dataNew } = await api.users.signUp.create(body).expect(200);

    expect(dataNew.key.id).not.toBe(dataOld.key.id);
    expect(dataNew.key.otp).not.toBe(dataOld.key.otp);
    expect(dataNew.key.expiresAt).not.toBe(dataOld.key.expiresAt);
    expect(dataNew.key.userId).toBe(dataOld.key.userId);
    expect(dataNew.key.type).toBe(KeyTypes.SignUp);
  });

  test("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente utilizar um email com formato incorreto", async () => {
    const generatedUser = userFactory.one();

    const { body: data } = await api.users.signUp
      .create({
        acceptedTerms: true,
        email: "invalid value for email",
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password,
        confirmUrl: dataProvider.url(),
      })
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].path).toBe("email");
    expect(data.errors[0].message).toBe("Email inválido");
  });

  test("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente usar um email que já existe e está confirmado", async () => {
    const generatedUser = userFactory.one();
    const body = {
      acceptedTerms: true,
      email: generatedUser.email,
      name: generatedUser.name,
      password: generatedUser.password,
      passwordConfirmation: generatedUser.password,
      confirmUrl: dataProvider.url(),
    };

    const { body: data } = await api.users.signUp.create(body).expect(200);

    const key = data.key;

    await api.users.signUp
      .update(key.id, {
        otp: DEFAULT_TESTING_OTP,
      })
      .expect(200);

    const { body: dataRetrySignup } = await api.users.signUp
      .create({
        acceptedTerms: true,
        email: generatedUser.email,
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password,
        confirmUrl: dataProvider.url(),
      })
      .expect(409);

    expect(dataRetrySignup.message).toBe("Você já confirmou seu E-mail");
  });

  test("[Create] - Deve falhar ao tentar iniciar o cadastro caso a confirmação da senha esteja incorreta", async () => {
    const generatedUser = userFactory.one();
    const { body: data } = await api.users.signUp
      .create({
        acceptedTerms: true,
        email: generatedUser.email,
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password + "wrongpass",
        confirmUrl: dataProvider.url(),
      })
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].path).toBe("passwordConfirmation");
    expect(data.errors[0].message).toBe("Confirmação incorreta");
  });

  test("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário não aceite os termos de uso", async () => {
    const generatedUser = userFactory.one();
    const { body: data } = await api.users.signUp
      .create({
        acceptedTerms: false,
        email: generatedUser.email,
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password,
        confirmUrl: dataProvider.url(),
      })
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].path).toBe("acceptedTerms");
    expect(data.errors[0].message).toBe("É necessário aceitar os termos de uso");
  });

  test("[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação", async () => {
    const generatedUser = userFactory.one();
    const body: SignUpCreateBody = {
      acceptedTerms: true,
      email: generatedUser.email,
      name: generatedUser.name,
      password: generatedUser.password,
      passwordConfirmation: generatedUser.password,
      confirmUrl: dataProvider.url(),
    };

    const { body: dataOld } = await api.users.signUp.create(body).expect(200);
    const { body: dataNew } = await api.users.signUp.resend(dataOld.key.id, { confirmUrl: dataProvider.url() }).expect(200);

    expect(dataNew.key.id).toBe(dataOld.key.id);
    expect(dataNew.key.otp).not.toBe(dataOld.key.otp);
    expect(dataNew.key.expiresAt).not.toBe(dataOld.key.expiresAt);
    expect(dataNew.key.userId).toBe(dataOld.key.userId);
    expect(dataNew.key.type).toBe(KeyTypes.SignUp);
  });

  test("[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente", async () => {
    const { body: data } = await api.users.signUp.resend(dataProvider.uuid(), { confirmUrl: dataProvider.url() }).expect(404);

    expect(data.message).toBe("Chave de acesso não encontrada");
  });

  test("[Update] - Deve ser capaz de finalizar o cadastro", async () => {
    const generatedUser = userFactory.one();
    const body = {
      acceptedTerms: true,
      email: generatedUser.email,
      name: generatedUser.name,
      password: generatedUser.password,
      passwordConfirmation: generatedUser.password,
      confirmUrl: dataProvider.url(),
    };

    const { body: data } = await api.users.signUp.create(body).expect(200);
    const key = data.key;

    const { body: dataSignUpConfirm } = await api.users.signUp
      .update(key.id, {
        otp: DEFAULT_TESTING_OTP,
      })
      .expect(200);

    expect(dataSignUpConfirm.token).toBeTruthy();
  });

  test("[Update] - Deve falhar ao tentar finalizar o cadastro utilizando uma chave inexistente", async () => {
    const { body: data } = await api.users.signUp
      .update(dataProvider.uuid(), {
        otp: DEFAULT_TESTING_OTP,
      })
      .expect(404);

    expect(data.message).toBe("Chave de acesso não encontrada");
  });

  test("[Update] - Deve falhar ao tentar finalizar o cadastro utilizando um código incorreto", async () => {
    const generatedUser = userFactory.one();
    const body = {
      acceptedTerms: true,
      email: generatedUser.email,
      name: generatedUser.name,
      password: generatedUser.password,
      passwordConfirmation: generatedUser.password,
      confirmUrl: dataProvider.url(),
    };

    const { body: data } = await api.users.signUp.create(body).expect(200);
    const { body: bodyConfirmSignUp } = await api.users.signUp
      .update(data.key.id, {
        otp: "999999",
      })
      .expect(418);

    expect(bodyConfirmSignUp.message).toBe("Código incorreto ou expirado");
  });
});
