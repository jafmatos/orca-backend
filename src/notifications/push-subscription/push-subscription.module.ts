import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushSubscriptionService } from './services/push-subscription.service';
import { PushSubscriptionController } from './controllers/push-subscription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  controllers: [PushSubscriptionController],
  providers: [PushSubscriptionService],
  exports: [PushSubscriptionService],
})
export class PushSubscriptionModule {}
