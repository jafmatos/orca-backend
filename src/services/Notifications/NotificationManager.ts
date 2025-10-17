import { User } from "Src/database/entities/User.entity";
import webpush from "web-push";
import { PushSubscriptionService } from "../PushSubcriptionService";

export class NotificationManager {
  public static setVapidKeys() {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_PUBLIC_KEY) throw new Error("No vapid keys defined");

    webpush.setVapidDetails("https://orca-financas.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  }

  public static async sendNotification(user: User, payload: object, onFailure?: (error: any) => void) {
    if (!user.pushSubscriptions?.length) return;

    await Promise.all(
      user.pushSubscriptions.map(async (pushSubscription) => {
        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
        } catch (error: any) {
          if (error.statusCode === 410) {
            PushSubscriptionService.remove(pushSubscription);
          }

          onFailure && onFailure(error);

          throw error;
        }
      })
    );
  }
}
