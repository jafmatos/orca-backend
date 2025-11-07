import { test } from "@jest/globals";
import { describeWithHooks } from "../infra/describeWithHooks";

describeWithHooks("Reminders", () => {
  test.todo("[List] - Deve ser capaz de listar os lembretes");

  test.todo("[List] - Deve sempre ordenar os lembretes pela data de referência");

  test.todo("[List] - Deve ser capaz de listar os lembretes usando paginação");

  test.todo("[List] - Deve listar apenas os lembretes não removidos");

  test.todo("[List] - Deve listar apenas os lembretes de categorias não removidas");

  test.todo("[List] - Deve ser capaz de filtrar os lembretes pela categoria");

  test.todo("[List] - Deve ser capaz de filtrar os lembretes por pesquisa incluindo o nome da categoria, descrição do lembrete ou valor");

  test.todo("[List] - Deve ser capaz de filtrar os lembretes pela data de referência");

  test.todo("[List] - Deve falhar ao tentar listar os lembretes caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve ser capaz de encontrar um lembrete");

  test.todo("[Show] - Deve ser capaz de encontrar um lembrete mesmo se ele estiver removido");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lembrete caso o usuário não esteja autenticado");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lembrete inexistente");

  test.todo("[Show] - Deve falhar ao tentar encontrar um lembrete caso ele pertença a outro usuário");

  test.todo("[Create] - Deve ser capaz de cadastrar um lembrete");

  test.todo("[Create] - Deve ser capaz de cadastrar um lembrete criando uma categoria que ainda não existe");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lembrete caso o usuário não esteja autenticado");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lembrete caso o valor seja menor do que zero");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lembrete caso a data de referência seja inválida");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lembrete caso a descrição seja maior que 255 caracteres");

  test.todo("[Create] - Deve falhar ao tentar cadastrar um lembrete utilizando uma categoria inexistente");

  test.todo("[Update] - Deve ser capaz de atualizar um lembrete");

  test.todo("[Update] - Deve ser capaz de atualizar um lembrete criando uma categoria que ainda não existe");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete caso o usuário não esteja autenticado");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete que não existe");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete caso ele pertença a outro usuário");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete caso o valor seja menor do que zero");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete caso a data de referência seja inválida");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete caso a descrição seja maior que 255 caracteres");

  test.todo("[Update] - Deve falhar ao tentar atualizar um lembrete utilizando uma categoria inexistente");

  test.todo("[Remove] - Deve ser capaz de remover um lembrete");

  test.todo("[Remove] - Deve falhar ao tentar remover um lembrete caso o usuário não esteja autenticado");

  test.todo("[Remove] - Deve falhar ao tentar remover um lembrete inexistente");

  test.todo("[Remove] - Deve falhar ao tentar remover um lembrete caso ele pertença a outro usuário");
});
