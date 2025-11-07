import { test } from "@jest/globals";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Users > avatar", () => {
  test.todo("[Update] - Deve ser capaz de adicionar uma foto de perfil");

  test.todo("[Update] - Deve ser capaz de atualizar a foto de perfil");

  test.todo("[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil sem enviar uma imagem");

  test.todo("[Update] - Deve falhar ao tentar adicionar ou atualizar a foto de perfil enviando uma imagem maior que 5MB de tamanho");

  test.todo("[Delete] - Deve ser capaz de remover a foto de perfil");

  test.todo("[Delete] - Deve falhar ao tentar remover a foto de perfil caso o usuário não esteja autenticado");
});
