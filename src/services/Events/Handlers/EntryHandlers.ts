import { bullService } from "Src/services/Bull/BullService";
import { BusEventName } from "../EventBus";
import { logger } from "Src/infra/Logger";
import { Entry } from "Src/database/entities/Entry.entity";
import { EntryRecurrencyService } from "Src/services/EntryRecurrencyServicec";
import { EntryService } from "Src/services/EntryService";
import { RecurrencyActions } from "Src/database/entities/EntryRecurrency.entity";
import { UserService } from "Src/services/UserService";
import { NotificationManager } from "Src/services/Notifications/NotificationManager";

const cronTimeFromEntry = (entry: Entry) => {
  if (!entry.when) throw new Error("Cannot set a schedule without a reference date");

  const referenceDateTime = new Date(entry.when!);
  const date = referenceDateTime.getDate();
  const hours = referenceDateTime.getHours();
  const minutes = referenceDateTime.getMinutes();

  return `0 ${minutes} ${hours} ${date} * *`;
};

const onCreate = async (entry: Entry) => {
  try {
    const { id, recurrency, ...body } = entry;
    const when = new Date();

    when.setHours(entry.when!.getHours(), entry.when!.getMinutes(), 0, 0);

    const newEntry = await EntryService.create({
      ...body,
      recurrencyId: body.recurrencyId,
      when,
    });
    const user = await UserService.findByIdWithPushSubscriptions(entry.userId);

    if (!user?.pushSubscriptions?.length || !user.acceptsNotifications) return;

    await NotificationManager.sendNotification(user, {
      body: `Um lançamento automático foi criado para a categoria ${newEntry.category!.name} no valor de ${newEntry.amount.toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        }
      )}`,
      title: "Lançamento cadastrado",
    });
  } catch (error) {
    logger.error(`Failed to create entry automatically`, error);
  }
};

const onNotify = async (entry: Entry) => {
  try {
    const user = await UserService.findByIdWithPushSubscriptions(entry.userId);

    if (!user?.pushSubscriptions?.length || !user.acceptsNotifications) return;

    await NotificationManager.sendNotification(
      user,
      {
        body: `Lembre-se de cadastrar o lançamento`,
        title: "Lembrete",
      },
      (error) => {
        logger.error(error);
      }
    );
  } catch (error) {
    logger.error(`Failed to send reminder notification to the user`, error);
  }
};

bullService.entryQueue.setJobPrefix("entry-recurrency").setHandler(async (payload) => {
  try {
    const recurrency = await EntryRecurrencyService.findById(payload.id);

    if (!recurrency) return;

    const entry = await EntryService.findLatestByRecurrency(recurrency.id);

    if (recurrency.action === RecurrencyActions.Create) await onCreate(entry);
    if (recurrency.action === RecurrencyActions.Notify) await onNotify(entry);
  } catch (error: any) {
    logger.error("Error while handling send notification queue handler: ", error);
  }
});

export class EntryHandlers {
  public static async setupSchedule(eventName: BusEventName, entry: Entry) {
    logger.info(`Handling bus event: ${eventName}`);

    try {
      if (!entry.recurrency) return;
      if (!entry.when) throw new Error("Cannot set a schedule without a reference date");

      await bullService.entryQueue.addSchedule(
        {
          id: entry.recurrency.id,
        },
        {
          jobId: entry.recurrency.id,
          repeat: {
            key: entry.recurrency.id,
            cron: cronTimeFromEntry(entry),
          },
          attempts: 3,
          timeout: 15000,
        }
      );
    } catch (error) {
      logger.error("Failed to add schedule: ", error);
    }
  }

  public static async cancelSchedule(eventName: BusEventName, entry: Entry) {
    logger.info(`Handling bus event: ${eventName}`);

    try {
      await bullService.entryQueue.removeSchedule(entry.recurrencyId!, cronTimeFromEntry(entry));
    } catch (error) {
      logger.error(`Error while handling event: ${eventName}`, error);
    }
  }
}
