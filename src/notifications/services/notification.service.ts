import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@/user/entities/user.entity';
import * as webpush from 'web-push';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PushSubscriptionService } from '../push-subscription/services/push-subscription.service';

export type NotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: object;
};

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly expo = new Expo();

  constructor(
    private readonly configService: ConfigService,
    private readonly pushSubscriptionService: PushSubscriptionService,
  ) {}

  onModuleInit() {
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');

    if (privateKey && publicKey) {
      webpush.setVapidDetails(
        'https://orca-financas.com',
        publicKey,
        privateKey,
      );
    } else {
      this.logger.warn('Vapid keys are not defined. Web Push will not work.');
    }
  }

  async sendNotification(
    user: User,
    payload: NotificationPayload,
    onFailure?: (error: any) => void,
  ) {
    const pushSubscriptions =
      user.pushSubscriptions ??
      (await this.pushSubscriptionService.findAllBy({ userId: user.id }));

    if (!pushSubscriptions?.length) return;

    const webpushSubscriptions = pushSubscriptions.filter(
      (sub) => sub.provider === 'webpush',
    );
    const expoSubscriptions = pushSubscriptions.filter(
      (sub) => sub.provider === 'expo',
    );

    const webpushPromises = webpushSubscriptions.map(
      async (pushSubscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: pushSubscription.endpoint!,
              keys: {
                p256dh: pushSubscription.keys!.p256dh,
                auth: pushSubscription.keys!.auth,
              },
            },
            JSON.stringify(payload),
          );
        } catch (error: any) {
          if (error.statusCode === 410) {
            await this.pushSubscriptionService.remove(pushSubscription);
          }

          onFailure && onFailure(error);
          throw error;
        }
      },
    );

    if (expoSubscriptions.length > 0) {
      const messages: ExpoPushMessage[] = [];

      for (const pushSubscription of expoSubscriptions) {
        this.logger.log(
          `[NotificationService] - Sending notification to user ${user.id} via expo`,
        );

        if (!Expo.isExpoPushToken(pushSubscription.expoPushToken)) {
          this.logger.log(
            `Invalid Expo push token: ${pushSubscription.expoPushToken} for user ${user.id}`,
          );
          continue;
        }

        messages.push({
          to: pushSubscription.expoPushToken,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data as Record<string, unknown>,
          badge: payload.badge ? parseInt(payload.badge, 10) : undefined,
        });
      }

      const chunks = this.expo.chunkPushNotifications(messages);
      const expoPromises = chunks.map(async (chunk) => {
        try {
          this.logger.log(
            `[NotificationService] - Sending notification chunk to user ${user.id} via expo`,
          );
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error: any) {
          this.logger.log(
            `[NotificationService] - Error sending notification to user ${user.id} via expo: ${error.message}`,
          );
          onFailure && onFailure(error);
          throw error;
        }
      });

      await Promise.allSettled([...webpushPromises, ...expoPromises]);
    } else {
      await Promise.allSettled(webpushPromises);
    }
  }
}
