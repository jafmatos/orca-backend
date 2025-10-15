import { BusEventName } from "../EventBus";
import { Reminder } from "Src/database/entities/Reminder.entity";

export class ReminderHandlers {
  public static async setupSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }

  public static async updateSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }

  public static async cancelSchedule(eventName: BusEventName, reminder: Reminder) {
    try {
      console.log(`Processing event: ${eventName}`);
    } catch (error) {
      console.log(`Error while handling event: ${eventName}`);
      console.log(error);
    }
  }
}
