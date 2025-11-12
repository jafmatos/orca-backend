import { User, UserRoles, Category, Entry, Reminder, Avatar, Subscription, UserKey, PushSubscription } from "../Models";

export class UserSetters {
  protected id!: string;
  protected stripeId!: string | undefined;
  protected role!: UserRoles;
  protected email!: string;
  protected name!: string;
  protected isEmailConfirmed!: boolean;
  protected acceptsNotifications!: boolean;
  protected pushSubscriptions!: PushSubscription[] | undefined;
  protected password!: string;
  protected periodGe!: string;
  protected periodLe!: string;
  protected periodManuallyAdjusted!: boolean;
  protected periodReferenceDay!: number;
  protected createdAt!: Date;
  protected updatedAt!: Date;
  protected acceptedTermsAt!: Date | null;
  protected lastLoggedIn!: Date | null;
  protected categories!: Category[] | undefined;
  protected entries!: Entry[] | undefined;
  protected reminders!: Reminder[] | undefined;
  protected avatar!: Avatar | undefined;
  protected subscription!: Subscription | undefined;
  protected keys!: UserKey[] | undefined;
  protected balance!: number | undefined;

  public setId(id: UserSetters["id"]) {
    this.id = id;

    return this;
  }

  public setStripeId(stripeId: UserSetters["stripeId"]) {
    this.stripeId = stripeId;

    return this;
  }

  public setRole(role: UserSetters["role"]) {
    this.role = role;

    return this;
  }

  public setEmail(email: UserSetters["email"]) {
    this.email = email;

    return this;
  }

  public setName(name: UserSetters["name"]) {
    this.name = name;

    return this;
  }

  public setIsEmailConfirmed(isEmailConfirmed: UserSetters["isEmailConfirmed"]) {
    this.isEmailConfirmed = isEmailConfirmed;

    return this;
  }

  public setAcceptsNotifications(acceptsNotifications: UserSetters["acceptsNotifications"]) {
    this.acceptsNotifications = acceptsNotifications;

    return this;
  }

  public setPushSubscriptions(pushSubscriptions: UserSetters["pushSubscriptions"]) {
    this.pushSubscriptions = pushSubscriptions;

    return this;
  }

  public setPassword(password: UserSetters["password"]) {
    this.password = password;

    return this;
  }

  public setPeriodGe(periodGe: UserSetters["periodGe"]) {
    this.periodGe = periodGe;

    return this;
  }

  public setPeriodLe(periodLe: UserSetters["periodLe"]) {
    this.periodLe = periodLe;

    return this;
  }

  public setPeriodManuallyAdjusted(periodManuallyAdjusted: UserSetters["periodManuallyAdjusted"]) {
    this.periodManuallyAdjusted = periodManuallyAdjusted;

    return this;
  }

  public setPeriodReferenceDay(periodReferenceDay: UserSetters["periodReferenceDay"]) {
    this.periodReferenceDay = periodReferenceDay;

    return this;
  }

  public setCreatedAt(createdAt: UserSetters["createdAt"]) {
    this.createdAt = createdAt;

    return this;
  }

  public setUpdatedAt(updatedAt: UserSetters["updatedAt"]) {
    this.updatedAt = updatedAt;

    return this;
  }

  public setAcceptedTermsAt(acceptedTermsAt: UserSetters["acceptedTermsAt"]) {
    this.acceptedTermsAt = acceptedTermsAt;

    return this;
  }

  public setLastLoggedIn(lastLoggedIn: UserSetters["lastLoggedIn"]) {
    this.lastLoggedIn = lastLoggedIn;

    return this;
  }

  public setCategories(categories: UserSetters["categories"]) {
    this.categories = categories;

    return this;
  }

  public setEntries(entries: UserSetters["entries"]) {
    this.entries = entries;

    return this;
  }

  public setReminders(reminders: UserSetters["reminders"]) {
    this.reminders = reminders;

    return this;
  }

  public setAvatar(avatar: UserSetters["avatar"]) {
    this.avatar = avatar;

    return this;
  }

  public setSubscription(subscription: UserSetters["subscription"]) {
    this.subscription = subscription;

    return this;
  }

  public setKeys(keys: UserSetters["keys"]) {
    this.keys = keys;

    return this;
  }

  public setBalance(balance: UserSetters["balance"]) {
    this.balance = balance;

    return this;
  }
}

export class UserBuilder extends UserSetters {
  private constructor() {
    super();
  }

  public static one(): UserBuilder {
    return new UserBuilder();
  }

  public build(): User {
    return new User(
      this.id,
      this.stripeId,
      this.role,
      this.email,
      this.name,
      this.isEmailConfirmed,
      this.acceptsNotifications,
      this.pushSubscriptions,
      this.password,
      this.periodGe,
      this.periodLe,
      this.periodManuallyAdjusted,
      this.periodReferenceDay,
      this.createdAt,
      this.updatedAt,
      this.acceptedTermsAt,
      this.lastLoggedIn,
      this.categories,
      this.entries,
      this.reminders,
      this.avatar,
      this.subscription,
      this.keys,
      this.balance
    );
  }
}
