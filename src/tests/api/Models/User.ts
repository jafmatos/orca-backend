import { UserSetters } from "../Builders/UserBuilder";
import { Avatar } from "./Avatar";
import { Category } from "./Category";
import { Entry } from "./Entry";
import { PushSubscription } from "./PushSubscription";
import { Reminder } from "./Reminder";
import { Subscription } from "./Subscription";
import { UserKey } from "./UserKey";

export enum UserRoles {
  User = "user",
  Admin = "admin",
  SuperUser = "super-user",
}

export class User extends UserSetters {
  constructor(
    public id: string,
    public stripeId: string | undefined,
    public role: UserRoles,
    public email: string,
    public name: string,
    public isEmailConfirmed: boolean,
    public acceptsNotifications: boolean,
    public pushSubscriptions: PushSubscription[] | undefined,
    public password: string,
    public periodGe: string,
    public periodLe: string,
    public periodManuallyAdjusted: boolean,
    public periodReferenceDay: number,
    public createdAt: Date,
    public updatedAt: Date,
    public acceptedTermsAt: Date | null,
    public lastLoggedIn: Date | null,
    public categories: Category[] | undefined,
    public entries: Entry[] | undefined,
    public reminders: Reminder[] | undefined,
    public avatar: Avatar | undefined,
    public subscription: Subscription | undefined,
    public keys: UserKey[] | undefined,
    public balance: number | undefined
  ) {
    super();
  }
}
