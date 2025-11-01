import { test } from "@jest/globals";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Users > sign-up", () => {
  test.todo("[Create] - Deve ser capaz de iniciar o cadastro");

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
