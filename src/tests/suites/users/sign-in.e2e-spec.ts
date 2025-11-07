import { test } from "@jest/globals";
import { describeWithHooks } from "../../infra/describeWithHooks";

describeWithHooks("Users > sign-in", () => {
  test.todo("[Create] - Deve ser capaz de acessar a conta com email e senha");

  test.todo("[Create] - Deve falhar ao tentar acessar a conta caso o email esteja em formato incorreto");

  test.todo("[Create] - Deve falhar ao tentar acessar a conta caso o email não tenha sido confirmado ainda");

  test.todo("[Create] - Deve falhar ao tentar acessar a conta caso o email esteja incorreto");

  test.todo("[Create] - Deve falhar ao tentar acessar a conta caso a senha esteja incorreta");

  test.todo("[Show] - Deve retornar o usuário autenticado pelo token");

  test.todo("[Show] - Deve falhar ao tentar retornar o usuário sem enviar o token");
});
