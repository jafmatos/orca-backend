import { dataProvider } from "Src/tests/data/Providers/dataProvider";
import { UserBuilder } from "../Builders/UserBuilder";

export class UserFactory {
  public one() {
    return UserBuilder.one()
      .setId(dataProvider.user.id())
      .setEmail(dataProvider.user.email())
      .setName(dataProvider.user.name())
      .setBalance(dataProvider.user.balance())
      .setIsEmailConfirmed(dataProvider.user.isEmailConfirmed())
      .setPassword(dataProvider.user.password())
      .setPeriodReferenceDay(dataProvider.user.periodReferenceDay())
      .setRole(dataProvider.user.role())
      .setAcceptedTermsAt(dataProvider.user.acceptedTermsAt())
      .setAcceptsNotifications(dataProvider.user.acceptsNotifications())
      .build();
  }
}

export const userFactory = new UserFactory();
