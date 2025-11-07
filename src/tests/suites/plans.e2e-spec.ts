import { test } from "@jest/globals";
import { describeWithHooks } from "../infra/describeWithHooks";

describeWithHooks("Plans", () => {
  test.todo("[List] - Deve ser capaz de listar os planos");

  test.todo("[Create] - Deve ser capaz de cadastrar um plano");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um plano caso o usuário não esteja autenticado");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um plano caso o valor seja menor que zero");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um plano caso o número de dias de teste seja menor que zero");

  test.todo("[Update] - Deve ser capaz de atualizar um plano");

  test.todo("[Update] - Deve falhar ao tentar atualizar um plano caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve falhar ao tentar atualizar um plano inexistente");

  test.todo("[Update] - Deve falhar ao tentar atualizar um plano caso o valor seja menor que zero");

  test.todo("[Update] - Deve falhar ao tentar atualizar um plano caso o número de dias de teste seja menor que zero");

  test.todo("[Remove] - Deve ser capaz de remover um plano");

  test.todo("[Remove] - Deve falhar ao tentar remover um plano caso o usuário não esteja autenticado");

  test.todo("[Remove] - Deve falhar ao tentar remover um plano inexistente");

  test.todo("[Remove] - Deve falhar ao tentar remover um plano caso exista alguma inscrição para ele");
});
