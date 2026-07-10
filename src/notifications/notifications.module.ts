import { Module } from '@nestjs/common';
import { PushSubscriptionModule } from '@/notifications/push-subscription/push-subscription.module';

import { NotificationService } from './services/notification.service';

@Module({
  imports: [PushSubscriptionModule],
  providers: [NotificationService],
  exports: [PushSubscriptionModule, NotificationService],
})
export class NotificationsModule {}
