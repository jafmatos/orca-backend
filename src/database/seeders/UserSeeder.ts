import { faker } from "@faker-js/faker";
import { User, UserRoles } from "Src/database/entities/User.entity";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { BaseSeeder } from "./BaseSeeder";

export class UserSeeder extends BaseSeeder<Omit<User, "id">, User> {
  constructor() {
    super(User);
  }

  public generate() {
    const createdAt = faker.date.past({ years: 2 });
    const periodReferenceDay = faker.number.int({ min: 1, max: 28 });
    const now = new Date();

    let periodGe: Date;
    let periodLe: Date;

    if (now.getDate() > periodReferenceDay) {
      periodGe = new Date();
      periodGe.setDate(periodReferenceDay);

      periodLe = new Date();
      periodLe.setMonth(periodLe.getMonth() + 1, periodReferenceDay);
    } else {
      periodGe = new Date();
      periodGe.setMonth(periodGe.getMonth() - 1, periodReferenceDay);

      periodLe = new Date();
      periodLe.setMonth(periodLe.getMonth(), periodReferenceDay);
    }

    periodGe.setHours(0, 0, 0);
    periodLe.setHours(0, 0, 0);

    return {
      role: faker.helpers.arrayElement([UserRoles.User, UserRoles.Admin, UserRoles.SuperUser]),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      isEmailConfirmed: faker.datatype.boolean(0.8),
      acceptsNotifications: faker.datatype.boolean(0.7),
      password: Bcrypt.hash(process.env.TESTING_DEFAULT_USER_PASSWORD! || "secret"),
      periodGe,
      periodLe,
      periodReferenceDay,
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
      acceptedTermsAt: createdAt,
      periodManuallyAdjusted: false,
      lastLoggedIn: faker.date.recent({ days: 30 }),
    };
  }
}

export const userSeeder = new UserSeeder();
