import { User } from "Src/database/entities/User.entity";
import { BusEventName } from "../EventBus";
import { UserService } from "Src/services/UserService";

export class UserTokenValidatedHandlers {
  public static async validateAndUpdatePeriod(eventName: BusEventName, user: User) {
    try {
      const periodGe = user.periodGe.getTime();
      const periodLe = user.periodLe.getTime();
      const now = Date.now();
      const periodIsValid = periodGe < now && now < periodLe;

      if (periodIsValid) return;

      const newPeriodGe = user.periodLe;
      newPeriodGe.setDate(user.periodReferenceDay);

      const newPeriodLe = user.periodGe;
      newPeriodLe.setMonth(newPeriodGe.getMonth() + 1, user.periodReferenceDay - 1);

      await UserService.update(user, {
        periodManuallyAdjusted: false,
        periodGe: newPeriodGe,
        periodLe: newPeriodLe,
      });
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`, error);
    }
  }
}
