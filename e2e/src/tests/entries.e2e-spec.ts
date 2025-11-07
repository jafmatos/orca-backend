import { test } from "@jest/globals";
import { describeWithHooks } from "Tests/infra/describeWithHooks";

describeWithHooks("Entries", () => {
  test.todo("[List] - Deve ser capaz de listar os lançamentos");

  test.todo("[List] - Deve ser capaz de listar os lançamentos usando paginação");

  test.todo("[List] - Deve listar apenas os lançamentos não removidos");

  test.todo("[List] - Deve listar apenas os lançamentos de categorias não removidas");

  test.todo("[List] - Deve ser capaz de filtrar os lançamentos pela data");

  test.todo("[List] - Deve ser capaz de filtrar os lançamentos pelo tipo");

  test.todo("[List] - Deve ser capaz de filtrar os lançamentos pela categoria");

  test.todo(
    "[List] - Deve ser capaz de filtrar os lançamentos por pesquisa incluindo o nome da categoria, descrição do lançamento ou valor"
  );

  test.todo("[List] - Deve ser capaz de filtrar os lançamentos ordenando pela data");

  test.todo("[List] - Deve ser capaz de filtrar os lançamentos ordenando pelo valor");

  test.todo("[List] - Deve falhar ao tentar listar os lançamentos caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve ser capaz de encontrar um lançamento");

  test.todo("[Show] - Deve ser capaz de encontrar um lançamento mesmo se ele estiver removido");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lançamento caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lançamento inexistente");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lançamento caso ele pertença a outro usuário");

  test.todo("[Create] - Deve ser capaz de cadastrar um lançamento");

  test.todo("[Create] - Deve ser capaz de cadastrar um lançamento criando uma categoria que ainda não existe");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lançamento caso o usuário não esteja autenticado");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lançamento caso o valor seja menor do que zero");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lançamento caso a data seja inválida");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lançamento caso a descrição seja maior que 255 caracteres");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lançamento utilizando uma categoria inexistente");

  test.todo("[Update] - Deve ser capaz de atualizar um lançamento");

  test.todo("[Update] - Deve ser capaz de atualizar um lançamento criando uma categoria que ainda não existe");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento que não existe");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento caso ele pertença a outro usuário");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento caso o valor seja menor do que zero");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento caso a data seja inválida");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento caso a descrição seja maior que 255 caracteres");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lançamento utilizando uma categoria inexistente");

  test.todo("[Remove] - Deve ser capaz de remover um lançamento");

  test.todo("[Remove] - Deve falhar ao tentar remover um lançamento caso o usuário não esteja autenticado");

  test.todo("[Remove] - Deve falhar ao tentar remover um lançamento inexistente");

  test.todo("[Remove] - Deve falhar ao tentar remover um lançamento caso ele pertença a outro usuário");

  test.todo("[Recover] - Deve ser capaz de recuperar um lançamento");

  test.todo("[Recover] - Deve falhar ao tentar recuperar um lançamento caso o usuário não esteja autenticado");

  test.todo("[Recover] - Deve falhar ao tentar recuperar um lançamento inexistente");

  test.todo("[Recover] - Deve falhar ao tentar recuperar um lançamento caso ele pertença a outro usuário");
});
