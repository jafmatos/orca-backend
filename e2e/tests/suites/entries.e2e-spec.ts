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

  test.todo("[Create] - Deve ser capaz de cadastrar um lançamento");
});
