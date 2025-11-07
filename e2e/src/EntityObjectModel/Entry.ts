import { $faker } from 'Tests/helpers/faker';

export class EntryObjectModel {
  type() {
    return ["income", "expense"][$faker.number.int({ min: 0, max: 1 })];
  }

  amount() {
    return $faker.number.float({
      min: 0.01,
      max: 500,
      fractionDigits: 2,
    });
  }

  description() {
    return $faker.lorem.paragraph({ min: 1, max: 2 });
  }

  when() {
    return $faker.date.past({ years: 1 });
  }
}
