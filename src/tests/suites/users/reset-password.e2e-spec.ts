import { test } from "@jest/globals";
import { describeWithHooks } from "../../infra/describeWithHooks";

describeWithHooks("Users > reset-password", () => {
  test.todo("[Create] - Deve ser capaz de iniciar a recuperação de senha");

  test.todo("[Create] - Deve falhar ao tentar iniciar a recuperação de senha caso o usuário tente utilizar um email com formato inválido");

  test.todo("[Create] - Deve falhar ao tentar iniciar a recuperação de senha caso o usuário tente usar um email que não existe no sistema");

  test.todo("[Resend] - Deve atualizar a chave de acesso quando o usuário solicitar o reenvio do email de confirmação");

  test.todo("[Resend] - Deve falhar ao tentar reenviar o email utilizando uma chave inexistente");

  test.todo("[Update] - Deve ser capaz de finalizar a recuperação de senha");

  test.todo("[Update] - Deve ser capaz de acessar a conta utilizando a nova senha");

  test.todo("[Update] - Deve falhar ao tentar finalizar a recuperação de senha utilizando uma chave inexistente");

  test.todo("[Update] - Deve falhar ao tentar finalizar a recuperação de senha utilizando uma chave expirada");

  test.todo("[Update] - Deve falhar ao tentar finalizar a recuperação de senha se a confirmação da nova senha estiver incorreta");
});
