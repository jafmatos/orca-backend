import { Entry } from "Src/database/entities/Entry.entity";
import { RecurrencyActions } from "Src/database/entities/EntryRecurrency.entity";
import { logger } from "Src/infra/Logger";
import { bullService } from "Src/services/Bull/BullService";
import { EntryRecurrencyService } from "Src/services/EntryRecurrencyService";
import { EntryService } from "Src/services/EntryService";
import { NotificationManager } from "Src/services/Notifications/NotificationManager";
import { UserService } from "Src/services/UserService";
import { BusEventName } from "../EventBus";

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

    const categorySlot = newEntry.category ? `na categoria "${newEntry.category!.name}"` : "sem categoria";

    await NotificationManager.sendNotification(user, {
      body: `Acabamos de registrar R$ ${newEntry.amount.toFixed(2)} ${categorySlot} para você.`,
      title: "Lançamento automático registrado",
    });
  } catch (error) {
    logger.error(`Failed to create entry automatically`, error);
  }
};

const onNotify = async (entry: Entry) => {
  try {
    const user = await UserService.findByIdWithPushSubscriptions(entry.userId);

    if (!user?.pushSubscriptions?.length || !user.acceptsNotifications) return;

    const categorySlot = entry.category ? `na categoria "${entry.category!.name}"` : "sem categoria";

    await NotificationManager.sendNotification(
      user,
      {
        body: `Registre agora: ${entry.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ${categorySlot}.`,
        title: "Mantenha suas finanças em dia!",
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
