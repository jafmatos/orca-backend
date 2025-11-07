import { User } from "./User";

export enum KeyTypes {
  SignUp = "sign-up",
  ResetPassword = "reset-password",
  DeleteAccount = "delete-account",
}

export class UserKey {
  constructor(
    public id: string,
    public type: KeyTypes,
    public otp: string,
    public userId: string,
    public data: Record<string, any> | undefined,
    public expiresAt: Date | undefined,
    public user: User | undefined
  ) {}
}
