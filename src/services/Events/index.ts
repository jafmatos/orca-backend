import { EventBus } from "./EventBus";
import { EntryHandlers } from "./Handlers/EntryHandlers";
import { UserTokenValidatedHandlers } from "./Handlers/UserHandlers";

export const eventBus = new EventBus();

eventBus.on("user:token_validated", UserTokenValidatedHandlers.validateAndUpdatePeriod);

eventBus.on("entry-recurrency:before-remove", EntryHandlers.cancelSchedule);
eventBus.on("entry-recurrency:before-update", EntryHandlers.cancelSchedule);
eventBus.on("entry-recurrency:created", EntryHandlers.setupSchedule);
eventBus.on("entry-recurrency:updated", EntryHandlers.setupSchedule);
