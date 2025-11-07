import { User } from "./User";

export class PushSubscription {
  constructor(
    public id: string,
    public endpoint: string,
    public keys: {
      p256dh: string;
      auth: string;
    },
    public userId: string,
    public user: User | undefined
  ) {}
}
