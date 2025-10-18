import Bull from "bull";
import { Reminder } from "Src/database/entities/Reminder.entity";

let instance: BullService;

export type BullNotificationJob = {
  id: string;
  notification: {
    title: string;
    body: string;
    data?: {
      reminder?: Reminder;
    };
    url?: string;
  };
};

export type BullNotificationJobHandler = (job: BullNotificationJob) => Promise<void>;

export class BullService {
  private readonly REDIS_HOST = process.env.REDIS_HOST!;
  private readonly REDIS_PORT = +process.env.REDIS_PORT!;
  private readonly REDIS_PASSWORD = process.env.REDIS_PASSWORD!;
  private readonly notificationQueue = new Bull("notifications", this.redisOptions!);

  constructor() {
    if (instance) return instance;

    instance = this;
  }

  get redisOptions(): Bull.QueueOptions | null {
    if (!this.REDIS_HOST || !this.REDIS_PORT || !this.REDIS_PASSWORD) throw new Error("Redis environment variables incomplete");

    return {
      redis: {
        host: this.REDIS_HOST,
        port: this.REDIS_PORT,
        password: this.REDIS_PASSWORD,
      },
      limiter: {
        max: 10,
        duration: 5000,
      },
    };
  }

  async addNotificationSchedule(job: BullNotificationJob, cronTime: Bull.CronRepeatOptions["cron"]) {
    try {
      await this.notificationQueue.add("notification-job", job, {
        jobId: job.id,
        repeat: {
          key: job.id,
          cron: cronTime,
        },
        attempts: 3,
        timeout: 15000,
      });
    } catch (error) {
      console.log("Failed to add schedule: ", error);
    }
  }

  async removeNotificationSchedule(id: BullNotificationJob["id"], cronTime: string) {
    await this.notificationQueue.removeRepeatableByKey(`notification-job:${id}:::${cronTime}`);
  }

  setNotificationQueueHandler(notificationQueueHandler: BullNotificationJobHandler) {
    this.notificationQueue.process("notification-job", async (payload, done) => {
      try {
        await notificationQueueHandler(payload.data as BullNotificationJob);

        done();
      } catch (error) {
        done(error as Error);
      }
    });
  }
}

export const bullService = new BullService();
