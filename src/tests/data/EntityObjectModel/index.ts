import { $faker } from "../../helpers/faker";
import { CategoryObjectModel } from "./Category";
import { EntryObjectModel } from "./Entry";
import { ReminderObjectModel } from "./Reminder";
import { UserObjectModel } from "./User";

export class EntityObjectModel {
  public readonly category = new CategoryObjectModel();
  public readonly entry = new EntryObjectModel();
  public readonly reminder = new ReminderObjectModel();
  public readonly user = new UserObjectModel();

  url() {
    return $faker.internet.url();
  }
}

export const dataGenerator = new EntityObjectModel();
