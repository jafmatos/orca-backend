import { Category } from "../Models";

export class CategoryBuilder {
  protected id!: Category["id"];
  protected isActive!: Category["isActive"];
  protected name!: Category["name"];
  protected mark: Category["mark"];
  protected userId!: Category["userId"];
  protected user: Category["user"];
  protected entries: Category["entries"];
  protected removedAt!: Category["removedAt"];
  protected spent: Category["spent"];

  private constructor() {}

  public static one() {
    return new CategoryBuilder();
  }

  public setId(id: CategoryBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setIsActive(isActive: CategoryBuilder["isActive"]) {
    this.isActive = isActive;

    return this;
  }

  public setName(name: CategoryBuilder["name"]) {
    this.name = name;

    return this;
  }

  public setMark(mark: CategoryBuilder["mark"]) {
    this.mark = mark;

    return this;
  }

  public setUserId(userId: CategoryBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setUser(user: CategoryBuilder["user"]) {
    this.user = user;

    return this;
  }

  public setEntries(entries: CategoryBuilder["entries"]) {
    this.entries = entries;

    return this;
  }

  public setRemovedAt(removedAt: CategoryBuilder["removedAt"]) {
    this.removedAt = removedAt;

    return this;
  }

  public setSpent(spent: CategoryBuilder["spent"]) {
    this.spent = spent;

    return this;
  }

  public build() {
    return new Category(this.id, this.isActive, this.name, this.mark, this.userId, this.user, this.entries, this.removedAt, this.spent);
  }
}
