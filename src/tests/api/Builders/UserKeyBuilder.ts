import { UserKey, KeyTypes, User } from "../Models";

export class UserKeyBuilder {
  protected id!: UserKey["id"];
  protected type!: UserKey["type"];
  protected otp!: UserKey["otp"];
  protected userId!: UserKey["userId"];
  protected data!: UserKey["data"];
  protected expiresAt!: UserKey["expiresAt"];
  protected user!: UserKey["user"];

  private constructor() {}

  public static one() {
    return new UserKeyBuilder();
  }

  public setId(id: UserKeyBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setType(type: UserKeyBuilder["type"]) {
    this.type = type;

    return this;
  }

  public setOtp(otp: UserKeyBuilder["otp"]) {
    this.otp = otp;

    return this;
  }

  public setUserId(userId: UserKeyBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setData(data: UserKeyBuilder["data"]) {
    this.data = data;

    return this;
  }

  public setExpiresAt(expiresAt: UserKeyBuilder["expiresAt"]) {
    this.expiresAt = expiresAt;

    return this;
  }

  public setUser(user: UserKeyBuilder["user"]) {
    this.user = user;

    return this;
  }

  public build() {
    return new UserKey(this.id, this.type, this.otp, this.userId, this.data, this.expiresAt, this.user);
  }
}
