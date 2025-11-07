import { Reminder, EntryTypes, Category, User } from "../Models";

export class ReminderBuilder {
  protected id!: Reminder["id"];
  protected isActive!: Reminder["isActive"];
  protected createEntryAutomatically!: Reminder["createEntryAutomatically"];
  protected type!: Reminder["type"];
  protected amount!: Reminder["amount"];
  protected description!: Reminder["description"];
  protected categoryId!: Reminder["categoryId"];
  protected category!: Reminder["category"];
  protected userId!: Reminder["userId"];
  protected user!: Reminder["user"];
  protected referenceDateTime!: Reminder["referenceDateTime"];
  protected removedAt!: Reminder["removedAt"];

  private constructor() {}

  public static one() {
    return new ReminderBuilder();
  }

  public setId(id: ReminderBuilder["id"]) {
    this.id = id;

    return this;
  }

  public setIsActive(isActive: ReminderBuilder["isActive"]) {
    this.isActive = isActive;

    return this;
  }

  public setCreateEntryAutomatically(createEntryAutomatically: ReminderBuilder["createEntryAutomatically"]) {
    this.createEntryAutomatically = createEntryAutomatically;

    return this;
  }

  public setType(type: ReminderBuilder["type"]) {
    this.type = type;

    return this;
  }

  public setAmount(amount: ReminderBuilder["amount"]) {
    this.amount = amount;

    return this;
  }

  public setDescription(description: ReminderBuilder["description"]) {
    this.description = description;

    return this;
  }

  public setCategoryId(categoryId: ReminderBuilder["categoryId"]) {
    this.categoryId = categoryId;

    return this;
  }

  public setCategory(category: ReminderBuilder["category"]) {
    this.category = category;

    return this;
  }

  public setUserId(userId: ReminderBuilder["userId"]) {
    this.userId = userId;

    return this;
  }

  public setUser(user: ReminderBuilder["user"]) {
    this.user = user;

    return this;
  }

  public setReferenceDateTime(referenceDateTime: ReminderBuilder["referenceDateTime"]) {
    this.referenceDateTime = referenceDateTime;

    return this;
  }

  public setRemovedAt(removedAt: ReminderBuilder["removedAt"]) {
    this.removedAt = removedAt;

    return this;
  }

  public build(): Reminder {
    return new Reminder(
      this.id,
      this.isActive,
      this.createEntryAutomatically,
      this.type,
      this.amount,
      this.description,
      this.categoryId,
      this.category,
      this.userId,
      this.user,
      this.referenceDateTime,
      this.removedAt
    );
  }
}