import { PushSubscription, User } from "../Models";

export class PushSubscriptionBuilder {
  protected id!: PushSubscription["id"];
  protected endpoint!: PushSubscription["endpoint"];
  protected keys!: PushSubscription["keys"];
  protected userId!: PushSubscription["userId"];
  protected user!: PushSubscription["user"];

  private constructor() {}

  public static one() {
    return new PushSubscriptionBuilder();
  }

  public setId(id: PushSubscriptionBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setEndpoint(endpoint: PushSubscriptionBuilder["endpoint"]) {
    this.endpoint = endpoint;

    return this;
  }

  public setKeys(keys: PushSubscriptionBuilder["keys"]) {
    this.keys = keys;

    return this;
  }

  public setUserId(userId: PushSubscriptionBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setUser(user: PushSubscriptionBuilder["user"]) {
    this.user = user;

    return this;
  }

  public build() {
    return new PushSubscription(
      this.id,
      this.endpoint,
      this.keys,
      this.userId,
      this.user
    );
  }
}