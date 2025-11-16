import Bull from "bull";
import { logger } from "Src/infra/Logger";
import { BullQueue } from "./BullQueue";
import { Entry } from "Src/database/entities/Entry.entity";

let instance: BullService;

export type BullNotificationJob = {
  id: string;
  notification?: {
    title: string;
    body: string;
    data?: {
      entry?: Entry;
    };
    url?: string;
  };
};

export type BullNotificationJobHandler = (job: BullNotificationJob) => Promise<void>;

export class BullService {
  private readonly REDIS_HOST = process.env.REDIS_HOST!;
  private readonly REDIS_PORT = +process.env.REDIS_PORT!;
  private readonly REDIS_PASSWORD = process.env.REDIS_PASSWORD!;
  public readonly entryQueue = new BullQueue<BullNotificationJob>("entries", this.redisOptions!);
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

  // TODO: nuke from addNotificationSchedule all the way down to setNotificationQueueHandler
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
      logger.error("Failed to add schedule: ", error);
    }
  }

  async removeNotificationSchedule(id: BullNotificationJob["id"], cronTime: string) {
    try {
      await this.notificationQueue.removeRepeatable("notification-job", {
        cron: cronTime,
        jobId: id,
      });
    } catch (error) {
      logger.error(`Error while removing schedule by id: ${id}`, error);
    }
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
  //////////////////
}

export const bullService = new BullService();
