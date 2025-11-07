import { Avatar, File, User } from "../Models";

export class AvatarBuilder {
  protected id!: File["id"];
  protected fileName!: File["fileName"];
  protected url!: File["url"];
  protected user!: User;

  protected constructor() {}

  public static one() {
    return new AvatarBuilder();
  }

  public setId(id: AvatarBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setFilename(fileName: AvatarBuilder["fileName"]) {
    this.fileName = fileName;

    return this;
  }

  public setUrl(url: AvatarBuilder["url"]) {
    this.url = url;

    return this;
  }

  public setUser(user: AvatarBuilder["user"]) {
    this.user = user;

    return this;
  }

  public build() {
    return new Avatar(this.id, this.fileName, this.url, this.user);
  }
}
