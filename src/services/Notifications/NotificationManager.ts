import { User } from "Src/database/entities/User.entity";
import webpush from "web-push";

export class NotificationManager {
  public static setVapidKeys() {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_PUBLIC_KEY) throw new Error("No vapid keys defined");

    webpush.setVapidDetails("https://orca-financas.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  }

  public static async sendNotification(user: User, payload: object) {
    await webpush.sendNotification(user.pushSubscription!, JSON.stringify(payload));
  }
}
