import { test } from "@jest/globals";
import { describeWithHooks } from "../../infra/describeWithHooks";

describeWithHooks("Users > delete-account", () => {
  test.todo("[Create] - Deve ser capaz de iniciar a exclusão da conta");

  test.todo("[Create] - Deve falhar ao tentar iniciar a exclusão da conta caso o usuário não esteja autenticado");

  test.todo("[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação");

  test.todo("[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente");

  test.todo("[Resend] - Deve falhar ao tentar reenviar o email caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve ser capaz de finalizar a exclusão da conta");

  test.todo("[Update] - Deve falhar ao tentar finalizar a exclusão da conta utilizando uma chave inexistente");

  test.todo("[Update] - Deve falhar ao tentar finalizar a exclusão da conta utilizando uma chave expirada");

  test.todo("[Update] - Deve falhar ao tentar finalizar a exclusão da conta caso o usuário não esteja autenticado");
});
