// import { NotificationManager } from "Src/services/Notifications/NotificationManager";
import { bullService } from "Src/services/Bull/BullService";
import { BusEventName } from "../EventBus";
import { Reminder } from "Src/database/entities/Reminder.entity";
import { UserService } from "Src/services/UserService";
import { BullNotificationJob } from "../../Bull/BullService";
import { ReminderService } from "Src/services/ReminderService";
import { IsNull } from "typeorm";
import { NotificationManager } from "Src/services/Notifications/NotificationManager";

bullService.setNotificationQueueHandler(async (payload: BullNotificationJob) => {
  try {
    const user = await UserService.findById(payload.notification.data!.reminder!.userId!);
    const reminder = await ReminderService.findOneBy({
      id: payload.notification.data!.reminder!.id,
      removedAt: IsNull(),
    });

    if (!user || !reminder) {
      await bullService.removeNotificationSchedule(payload.id);

      return;
    }

    if (!user.subscription?.isValid || !user.acceptsNotifications || !user.pushSubscription || !reminder!.isActive) {
      return;
    }

    await NotificationManager.sendNotification(user, payload);
  } catch (error: any) {
    if (error.statusCode === 410) {
      await bullService.removeNotificationSchedule(payload.id);
    }

    console.log("Error while handling send notification queue handler: ", error);
  }
});

const getNotificationJobIdForReminder = (reminder: Reminder) => {
  return `notifications;user-${reminder.userId};reminder-${reminder.id}`;
};

export class ReminderHandlers {
  public static async setupSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      const time = new Date(reminder.time);

      await bullService.addNotificationSchedule(
        {
          id: getNotificationJobIdForReminder(reminder),
          notification: {
            body: `${reminder.category?.name || "Sem categoria"}: ${reminder.description || "Sem descrição"} - ${(
              reminder.amount || 0
            ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            title: "💡 Lembrete",
            url: "https://youtube.com",
          },
        },
        `0 ${time.getMinutes()} ${time.getHours()} ${reminder.dayOfMonth} * *`
      );
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }

  public static async updateSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);

      await bullService.removeNotificationSchedule(getNotificationJobIdForReminder(reminder));
      await ReminderHandlers.setupSchedule(eventName, reminder);
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }

  public static async cancelSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);
      await bullService.removeNotificationSchedule(getNotificationJobIdForReminder(reminder));
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }
}
