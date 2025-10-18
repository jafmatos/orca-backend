// import { NotificationManager } from "Src/services/Notifications/NotificationManager";
import { bullService } from "Src/services/Bull/BullService";
import { BusEventName } from "../EventBus";
import { Reminder } from "Src/database/entities/Reminder.entity";
import { UserService } from "Src/services/UserService";
import { BullNotificationJob } from "../../Bull/BullService";
import { ReminderService } from "Src/services/ReminderService";
import { IsNull } from "typeorm";
import { NotificationManager } from "Src/services/Notifications/NotificationManager";

const jobIdPrefix = "notifications:reminder-";

const getNotificationJobIdForReminder = (reminder: Reminder) => {
  return `${jobIdPrefix}${reminder.id}`;
};

bullService.setNotificationQueueHandler(jobIdPrefix, async (payload: BullNotificationJob) => {
  try {
    const user = await UserService.findByIdWithPushSubscriptions(payload.notification.data!.reminder!.userId!);
    const reminder = await ReminderService.findOneBy({
      id: payload.notification.data!.reminder!.id,
      removedAt: IsNull(),
    });

    if (
      !reminder ||
      !user?.subscription?.isValid ||
      !user?.acceptsNotifications ||
      !user?.pushSubscriptions?.length ||
      !reminder!.isActive
    ) {
      return;
    }

    if (!user) {
      await bullService.removeNotificationSchedule(payload.id, reminder.monthlyCronTime);

      return;
    }

    await NotificationManager.sendNotification(user, payload, async (error) => {
      console.log("Error while trying to send a notification: ", error);

      if (error.statusCode === 410) {
        await bullService.removeNotificationSchedule(payload.id, reminder.monthlyCronTime);
      }
    });

    console.log("Notification sent");
  } catch (error: any) {
    console.log("Error while handling send notification queue handler: ", error);
  }
});

export class ReminderHandlers {
  public static async setupSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      await bullService.addNotificationSchedule(
        {
          id: getNotificationJobIdForReminder(reminder),
          notification: {
            body: `${reminder.category?.name || "Sem categoria"}: ${reminder.description || "Sem descrição"} - ${(
              reminder.amount || 0
            ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            data: {
              reminder,
            },
            title: "💡 Lembrete",
            url: "https://youtube.com",
          },
        },
        reminder.monthlyCronTime
      );
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }

  public static async cancelSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);
      await bullService.removeNotificationSchedule(getNotificationJobIdForReminder(reminder), reminder.monthlyCronTime);
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }
}
