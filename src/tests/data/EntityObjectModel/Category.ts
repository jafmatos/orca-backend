import { $faker } from "../../helpers/faker";

export class CategoryObjectModel {
  isActive() {
    return $faker.datatype.boolean();
  }

  name() {
    return $faker.commerce.department();
  }

  mark() {
    return $faker.number.float({
      min: 0.01,
      max: 10000,
      fractionDigits: 2,
    });
  }
}
