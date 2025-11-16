import { $faker } from "Src/tests/helpers/faker";
import { CategoryDataProvider } from "./CategoryDataProvider";
import { EntryDataProvider } from "./EntryDataProvider";
import { UserDataProvider } from "./UserDataProvider";

export class DataProvider {
  public readonly user = new UserDataProvider();
  public readonly category = new CategoryDataProvider();
  public readonly entry = new EntryDataProvider();

  url() {
    return $faker.internet.url();
  }

  uuid() {
    return $faker.string.uuid();
  }
}

export const dataProvider = new DataProvider();
