import Bull from "bull";
import { logger } from "Src/infra/Logger";

export type BullQueueHandler<T> = (job: T) => Promise<void>;

export class BullQueue<T extends { id: string }> {
  private queue: Bull.Queue<T>;
  private jobPrefix?: string;

  constructor(queueName: string, opts?: Bull.QueueOptions) {
    this.queue = new Bull(queueName, opts);
  }

  setJobPrefix(prefix: string) {
    this.jobPrefix = prefix;

    return this;
  }

  setHandler(handler: BullQueueHandler<T>) {
    const callback: Bull.ProcessCallbackFunction<T> = async (payload, done) => {
      try {
        await handler(payload.data as T);

        done();
      } catch (error) {
        done(error as Error);
      }
    };

    if (!this.jobPrefix) {
      this.queue.process(callback);

      return this;
    }

    this.queue.process(this.jobPrefix, callback);

    return this;
  }

  async addSchedule(data: T, opts: Bull.JobOptions) {
    try {
      if (!this.jobPrefix) {
        return await this.queue.add(data, opts);
      }

      return await this.queue.add(this.jobPrefix, data, opts);
    } catch (error) {
      logger.error(`Error while adding schedule with id: ${data.id}`, error);
    }
  }

  async removeSchedule(id: T["id"], cronTime: string) {
    try {
      if (!this.jobPrefix) {
        await this.queue.removeRepeatable({
          cron: cronTime,
          jobId: id,
        });
      } else {
        await this.queue.removeRepeatable(this.jobPrefix, {
          cron: cronTime,
          jobId: id,
        });
      }
    } catch (error) {
      logger.error(`Error while removing schedule by id: ${id}`, error);
    }
  }
}
