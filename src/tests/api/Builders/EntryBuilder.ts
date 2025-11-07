import { Entry } from "../Models";

export class EntryBuilder {
  protected id!: Entry["id"];
  protected type!: Entry["type"];
  protected amount!: Entry["amount"];
  protected description!: Entry["description"];
  protected when!: Entry["when"];
  protected categoryId!: Entry["categoryId"];
  protected category!: Entry["category"];
  protected userId!: Entry["userId"];
  protected user!: Entry["user"];
  protected removedAt!: Entry["removedAt"];

  private constructor() {}

  public static one(): EntryBuilder {
    return new EntryBuilder();
  }

  public setId(id: EntryBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setType(type: EntryBuilder["type"]) {
    this.type = type;

    return this;
  }

  public setAmount(amount: EntryBuilder["amount"]) {
    this.amount = amount;

    return this;
  }

  public setDescription(description: EntryBuilder["description"]) {
    this.description = description;

    return this;
  }

  public setWhen(when: EntryBuilder["when"]) {
    this.when = when;

    return this;
  }

  public setCategoryId(categoryId: EntryBuilder["categoryId"]) {
    this.categoryId = categoryId;

    return this;
  }

  public setCategory(category: EntryBuilder["category"]) {
    this.category = category;

    return this;
  }

  public setUserId(userId: EntryBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setUser(user: EntryBuilder["user"]) {
    this.user = user;

    return this;
  }

  public setRemovedAt(removedAt: EntryBuilder["removedAt"]) {
    this.removedAt = removedAt;

    return this;
  }

  public build() {
    return new Entry(
      this.id,
      this.type,
      this.amount,
      this.description,
      this.when,
      this.categoryId,
      this.category,
      this.userId,
      this.user,
      this.removedAt
    );
  }
}