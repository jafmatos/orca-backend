import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { PlanController } from './controllers/plan.controller';
import { BillingPortalsController } from './controllers/billing-portals.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { StripeService } from './services/stripe.service';
import { User } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Plan, Subscription])],
  controllers: [
    PlanController,
    BillingPortalsController,
    CheckoutController,
    StripeWebhookController,
  ],
  providers: [PlanService, SubscriptionService, StripeService, UserService],
  exports: [PlanService, SubscriptionService, StripeService],
})
export class SubscriptionModule {}
