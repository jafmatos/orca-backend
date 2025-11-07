import { test } from "@jest/globals";
import { describeWithHooks } from "../infra/describeWithHooks";

describeWithHooks("Push Subscriptions", () => {
  test.todo("[Create] - Deve ser capaz de cadastrar uma push subscription");

  test.todo("[Create] - Deve falhar ao tentar cadastrar uma push subscription caso o usuário não esteja autenticado");
});
