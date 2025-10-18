import { EventBus } from "./EventBus";
import { ReminderHandlers } from "./Handlers/ReminderHandlers";
import { UserTokenValidatedHandlers } from "./Handlers/UserHandlers";

export const eventBus = new EventBus();

eventBus.on("user:token_validated", UserTokenValidatedHandlers.validateAndUpdatePeriod);

eventBus.on("reminder:before-remove", ReminderHandlers.cancelSchedule);
eventBus.on("reminder:before-update", ReminderHandlers.cancelSchedule);
eventBus.on("reminder:created", ReminderHandlers.setupSchedule);
eventBus.on("reminder:updated", ReminderHandlers.setupSchedule);
