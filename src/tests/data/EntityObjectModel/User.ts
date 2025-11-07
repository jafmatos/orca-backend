import { $faker } from "../../helpers/faker";

export class UserObjectModel {
  role() {
    return ["user", "admin"][+(Math.random() < 0.95)];
  }

  email() {
    return $faker.internet.email();
  }

  name() {
    return $faker.person.fullName();
  }

  isEmailConfirmed() {
    return $faker.datatype.boolean();
  }

  acceptsNotifications() {
    return $faker.datatype.boolean();
  }

  password() {
    return $faker.string.alphanumeric({
      length: {
        min: 6,
        max: 16,
      },
    });
  }

  periodReferenceDay() {
    return $faker.number.int({
      min: 1,
      max: 28,
    });
  }
}
