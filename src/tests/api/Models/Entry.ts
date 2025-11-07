import { Category } from "./Category";
import { User } from "./User";

export enum EntryTypes {
  Income = "income",
  Expense = "expense",
}

export class Entry {
  constructor(
    public id: string,
    public type: EntryTypes,
    public amount: number,
    public description: string | undefined,
    public when: Date | undefined,
    public categoryId: string | null,
    public category: Category | null,
    public userId: string,
    public user: User | undefined,
    public removedAt: Date | null
  ) {}
}
