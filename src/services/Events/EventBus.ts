import { v4 } from "uuid";

export type BusEventName =
  | "user:logged_in"
  | "user:authenticated"
  | "user:token_validated"
  | "reminder:created"
  | "reminder:updated"
  | "reminder:removed";

export type BusEventHandler = (eventName: BusEventName, args?: any) => Promise<void>;

export type BusEventListener = {
  id: string;
  event: BusEventName;
  handle: BusEventHandler;
};

let instance: EventBus;

export class EventBus {
  private listeners: BusEventListener[] = [];

  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  private getListenerByEventName(eventName: BusEventName) {
    return this.listeners.filter((listener) => listener.event === eventName);
  }

  private getListenerByEventNameDiffer(eventName: BusEventName) {
    return this.listeners.filter((listener) => listener.event !== eventName);
  }

  private getListenerByListenerId(id: string) {
    return this.listeners.filter((listener) => listener.id === id);
  }

  private getListenerByListenerIdDiffer(id: string) {
    return this.listeners.filter((listener) => listener.id !== id);
  }

  on(eventName: BusEventName, handler: BusEventHandler) {
    const id = v4();

    this.listeners.push({
      id,
      event: eventName,
      handle: handler,
    });
  }

  trigger(eventName: BusEventName, args?: any) {
    const listenersToTrigger = this.getListenerByEventName(eventName);

    for (const listener of listenersToTrigger) {
      listener.handle(eventName, args);
    }
  }

  async triggerAsync(eventName: BusEventName, args?: any) {
    const listenersToTrigger = this.getListenerByEventName(eventName);
    const promises = listenersToTrigger.map(
      (listener) =>
        new Promise(async (resolve, reject) => {
          try {
            resolve(await listener.handle(eventName, args));
          } catch (error) {
            reject(error);
          }
        })
    );

    await Promise.allSettled(promises);
  }

  triggerById(id: string, args?: any) {
    const listenersToTrigger = this.getListenerByListenerId(id);

    for (const listener of listenersToTrigger) {
      listener.handle(listener.event, args);
    }
  }

  removeByEventName(eventName: BusEventName) {
    this.listeners = this.getListenerByEventNameDiffer(eventName);
  }

  removeByListenerId(id: string) {
    this.listeners = this.getListenerByListenerIdDiffer(id);
  }
}
