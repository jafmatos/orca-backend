import { test } from "@jest/globals";
import { api } from "Tests/api/Requests";
import { dataGenerator } from "Tests/EntityObjectModel";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Users > sign-up", () => {
  test("[Create] - Deve ser capaz de iniciar o cadastro", async () => {
    const password = dataGenerator.user.password();

    const { body: data } = await api.users.signUp
      .create({
        acceptedTerms: true,
        email: dataGenerator.user.email(),
        name: dataGenerator.user.name(),
        password,
        passwordConfirmation: password,
        confirmUrl: dataGenerator.url(),
      })
      .expect(200);

    console.log(data);
  });

  test.todo(
    "[Create] - Deve gerar uma nova chave de acesso quando o usuário tentar se cadastrar com um email que já existe e não está confirmado"
  );

  test.todo("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente utilizar um email com formato incorreto");

  test.todo("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário tente usar um email que já existe e está confirmado");

  test.todo("[Create] - Deve falhar ao tentar iniciar o cadastro caso a confirmação da senha esteja incorreta");

  test.todo("[Create] - Deve falhar ao tentar iniciar o cadastro caso o usuário não aceite os termos de uso");

  test.todo("[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação");

  test.todo("[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente");

  test.todo("[Update] - Deve ser capaz de finalizar o cadastro");

  test.todo("[Update] - Deve falhar ao tentar finalizar o cadastro utilizando uma chave inexistente");

  test.todo("[Update] - Deve falhar ao tentar finalizar o cadastro utilizando uma chave expirada");
});
