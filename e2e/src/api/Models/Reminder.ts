import { Category } from "./Category";
import { EntryTypes } from "./Entry";
import { User } from "./User";

export class Reminder {
  constructor(
    public id: string,
    public isActive: boolean,
    public createEntryAutomatically: boolean,
    public type: EntryTypes,
    public amount: number | undefined,
    public description: string | undefined,
    public categoryId: string | null,
    public category: Category | null,
    public userId: string,
    public user: User | undefined,
    public referenceDateTime: Date,
    public removedAt: Date | null
  ) {}
}
