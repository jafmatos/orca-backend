import { test } from "@jest/globals";
import { describeWithHooks } from "../../infra/describeWithHooks";

describeWithHooks("Users", () => {
  test.todo("[Update] - Deve ser capaz de atualizar os dados da conta");

  test.todo("[Update] - Deve falhar ao tentar atualizar os dados da conta caso o usuário não esteja autenticado");

  test.todo(
    "[Update] - Deve falhar ao tentar atualizar os dados da conta caso o usuário envie uma data de encerramento de período menor que a data de início de período"
  );
});
