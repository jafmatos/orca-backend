import { AccountApi } from "./Users/Account.api";
import { AvatarApi } from "./Users/Avatar.api";
import { CategoriesApi } from "./Categories.api";
// import { DeleteAccountApi } from "./Users/DeleteAccount.api";
import { EntriesApi } from "./Entries.api";
import { OverviewApi } from "./Overview.api";
import { PlansApi } from "./Plans.api";
import { PushSubscriptionsApi } from "./PushSubscriptions.api";
import { ResetPasswordApi } from "./Users/ResetPassword.api";
import { SignInApi } from "./Users/SignIn.api";
import { SignUpApi } from "./Users/SignUp.api";

class UsersApi {
  public readonly signUp = new SignUpApi();
  public readonly signIn = new SignInApi();
  public readonly resetPassword = new ResetPasswordApi();
  // public readonly deleteAccount = new DeleteAccountApi();
  public readonly avatar = new AvatarApi();
  public readonly account = new AccountApi();
}

export class Api {
  public readonly users = new UsersApi();
  public readonly entries = new EntriesApi();
  public readonly categories = new CategoriesApi();
  public readonly overview = new OverviewApi();
  public readonly pushSubscriptions = new PushSubscriptionsApi();
  public readonly plans = new PlansApi();
}

export const api = new Api();
