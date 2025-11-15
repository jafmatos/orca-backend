import { expect, test } from "@jest/globals";
import { describeWithHooks } from "../../infra/describeWithHooks";
import { api } from "Src/tests/api/Requests";
import { SUPER_USER_EMAIL, SUPER_USER_PASSWORD } from "Src/tests/variables";
import { dataProvider } from "Src/tests/data/Providers/dataProvider";
import { userFactory } from "Src/tests/api/Factories/UserFactory";

describeWithHooks("Users > sign-in", () => {
  test("[Create] - Deve ser capaz de acessar a conta com email e senha", async () => {
    const { body: data } = await api.users.signIn
      .create({
        email: SUPER_USER_EMAIL,
        password: SUPER_USER_PASSWORD,
      })
      .expect(200);

    expect(data.token).toBeTruthy();
    expect(data.balance).not.toBeNull();
    expect(data.user.email).toBe(SUPER_USER_EMAIL);
  });

  test("[Create] - Deve falhar ao tentar acessar a conta caso o email esteja em formato incorreto", async () => {
    const { body: data } = await api.users.signIn
      .create({
        email: "this is not an email",
        password: "secret",
      })
      .expect(422);

    expect(data.errors).toBeTruthy();
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].path).toBe("email");
    expect(data.errors[0].message).toBe("Email inválido");
  });

  test("[Create] - Deve falhar ao tentar acessar a conta caso o email não tenha sido confirmado ainda", async () => {
    const generatedUser = userFactory.one();

    await api.users.signUp
      .create({
        acceptedTerms: true,
        email: generatedUser.email,
        name: generatedUser.name,
        password: generatedUser.password,
        passwordConfirmation: generatedUser.password,
        confirmUrl: dataProvider.url(),
      })
      .expect(200);

    const { body: data } = await api.users.signIn
      .create({
        email: generatedUser.email,
        password: generatedUser.password,
      })
      .expect(409);

    expect(data.message).toBe("Você precisa confirmar o E-mail antes de acessar sua conta. Verifique sua caixa de entrada!");
  });

  test("[Create] - Deve falhar ao tentar acessar a conta caso o email esteja incorreto", async () => {
    const { body: data } = await api.users.signIn
      .create({
        email: "unexistingvalidemail@gmail.com",
        password: "secret",
      })
      .expect(418);

    expect(data.message).toBe("Credenciais inválidas");
  });

  test("[Create] - Deve falhar ao tentar acessar a conta caso a senha esteja incorreta", async () => {
    const { body: data } = await api.users.signIn
      .create({
        email: SUPER_USER_EMAIL,
        password: "incorrectpassword",
      })
      .expect(418);

    expect(data.message).toBe("Credenciais inválidas");
  });

  test("[Show] - Deve retornar o usuário autenticado pelo token", async () => {
    const {
      body: { token },
    } = await api.users.signIn
      .create({
        email: SUPER_USER_EMAIL,
        password: SUPER_USER_PASSWORD,
      })
      .expect(200);

    const { body: data } = await api.users.signIn.show(`Bearer ${token}`).expect(200);

    const user = data.user;

    expect(user).toBeTruthy();
    expect(user.email).toBe(SUPER_USER_EMAIL);
    expect(user.name).not.toBeNull();
    expect(user.periodReferenceDay).not.toBeNull();
    expect(user.balance).not.toBeNull();
  });

  test("[Show] - Deve falhar ao tentar retornar o usuário sem enviar o token", async () => {
    await api.users.signIn.show("").expect(401);
  });

  test("[Show] - Deve falhar ao tentar retornar o usuário enviando um token com formato inválido", async () => {
    await api.users.signIn.show("tokenwithinvalidformat").expect(401);
  });
});
