import { test } from "@jest/globals";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Overview", () => {
  test.todo("[Show] - Deve ser capaz de exibir a visão geral");

  test.todo("[Show] - Deve retornar o total de despesas, total de receitas e saldo corretamente de acordo com o ciclo do usuário");

  test.todo("[Show] - Deve retornar o total de despesas, total de receitas e saldo corretamente quando estiver usando filtros de data");

  test.todo("[Show] - Deve falhar ao tentar exibir a visão geral caso o usuário não esteja autenticado");
});
