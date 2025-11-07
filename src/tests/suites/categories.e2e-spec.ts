import { test } from "@jest/globals";
import { describeWithHooks } from "../infra/describeWithHooks";

describeWithHooks("Categories", () => {
  test.todo("[List] - Deve ser capaz de listar as categorias");

  test.todo("[List] - Deve ser capaz de listar as categorias usando paginação");

  test.todo("[List] - Deve listar apenas as categorias não removidas");

  test.todo("[List] - Deve calcular corretamente o valor gasto por categoria de acordo com o ciclo do usuário");

  test.todo("[List] - Deve calcular corretamente o valor gasto por categoria quando estiver utilizando filtros de data");

  test.todo("[List] - Deve falhar ao tentar listar as categorias caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve ser capaz de encontrar uma categoria");

  test.todo("[Show] - Deve ser capaz de encontrar uma categoria mesmo se estiver removida");

  test.todo("[Show] - Deve falhar ao tentar encontrar uma categoria caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve falhar ao tentar encontrar uma categoria caso ela pertença a outro usuário");

  test.todo("[Create] - Deve ser capaz de cadastrar uma categoria");

  test.todo("[Create] - Deve falhar ao tentar cadastrar uma categoria caso o usuário não esteja autenticado");

  test.todo("[Create] - Deve falhar ao tentar cadastrar uma categoria caso a meta seja menor do que zero");

  test.todo("[Update] - Deve ser capaz de atualizar uma categoria");

  test.todo("[Update] - Deve falhar ao tentar atualizar uma categoria caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve falhar ao tentar atualizar uma categoria inexistente");

  test.todo("[Update] - Deve falhar ao tentar atualizar uma categoria caso ela pertença a outro usuário");

  test.todo("[Update] - Deve falhar ao tentar atualizar uma categoria caso a meta seja menor do que zero");

  test.todo("[Remove] - Deve ser capaz de remover uma categoria");

  test.todo("[Remove] - Deve falhar ao tentar remover uma categoria caso o usuário não esteja autenticado");

  test.todo("[Remove] - Deve falhar ao tentar remover uma categoria inexistente");

  test.todo("[Remove] - Deve falhar ao tentar remover uma categoria caso ela pertença a outro usuário");

  test.todo("[Recover] - Deve ser capaz de recuperar uma categoria");

  test.todo("[Recover] - Deve falhar ao tentar recuperar uma categoria caso o usuário não esteja autenticado");

  test.todo("[Recover] - Deve falhar ao tentar recuperar uma categoria inexistente");

  test.todo("[Recover] - Deve falhar ao tentar recuperar uma categoria caso ela pertença a outro usuário");
});
