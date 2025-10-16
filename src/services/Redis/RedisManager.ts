import { createClient } from "redis";

export class RedisManager {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async makeClient() {
    const client = createClient({ url: this.url });

    await client.connect();

    return client;
  }

  async get(key: string): Promise<{ [key: string]: any } | null> {
    const client = await this.makeClient();

    try {
      const value = await client.get(key);

      if (!value) return null;

      return JSON.parse(value);
    } catch (error) {
      console.log(`Error while trying to get key ${key} from Redis: ${error}`);
      return null;
    } finally {
      await client.disconnect();
    }
  }

  async set(key: string, value: string, expiresIn?: number): Promise<void> {
    const client = await this.makeClient();

    try {
      await client.set(key, value);

      if (expiresIn) {
        await client.expire(key, expiresIn);
      }
    } catch (error) {
      console.log(`Error while trying to get key ${key} from Redis: ${error}`);
    } finally {
      await client.disconnect();
    }
  }
}
