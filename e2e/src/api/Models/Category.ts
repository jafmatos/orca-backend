import { Entry } from "./Entry";
import { User } from "./User";

export class Category {
  constructor(
    public id: string,
    public isActive: boolean,
    public name: string,
    public mark: number | undefined,
    public userId: string | null,
    public user: User | undefined,
    public entries: Entry[] | undefined,
    public removedAt: Date | null,
    public spent: number | undefined
  ) {}
}
