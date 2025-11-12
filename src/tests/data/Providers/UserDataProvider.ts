import { User, UserRoles } from "Tests/api/Models";
import { DataProviderFor } from "Tests/types/DataProviderFor";
import { $faker } from "Tests/helpers/faker";
import { ProbabilityMap } from "Src/tests/helpers/ProbabilityMap";

export class UserDataProvider implements DataProviderFor<User> {
  id() {
    return $faker.string.uuid();
  }

  name() {
    return $faker.person.fullName();
  }

  balance() {
    return $faker.number.float({ min: 0, max: 100_000 });
  }

  email() {
    return $faker.internet.email();
  }

  password() {
    return "secret";
  }

  isEmailConfirmed() {
    return $faker.datatype.boolean({ probability: 0.9 });
  }

  acceptsNotifications() {
    return $faker.datatype.boolean();
  }

  acceptedTermsAt() {
    return $faker.date.past({ years: 2 });
  }

  periodReferenceDay() {
    return $faker.number.int({ min: 1, max: 28 });
  }

  role() {
    const probabilityMap = new ProbabilityMap<UserRoles>({
      5: UserRoles.Admin,
      95: UserRoles.User,
    });

    return probabilityMap.generate();
  }
}
