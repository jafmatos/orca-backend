import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import { SubscriptionService } from '@/subscription/services/subscription.service';
import { UserService } from '@/user/services/user.service';
import type { RawBodyRequest } from '@nestjs/common';
import { Controller, Logger, Post, Req, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../services/stripe.service';

@Controller('stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
  ) {
    const endpointSecret = this.configService.get<string>(
      'STRIPE_ENDPOINT_SECRET',
    );
    let event = request.body;

    if (endpointSecret) {
      const signature = request.headers['stripe-signature'] as string;
      try {
        event = this.stripeService
          .getStripeInstance()
          .webhooks.constructEvent(request.rawBody!, signature, endpointSecret);
      } catch (error: any) {
        this.logger.error(
          `⚠️  Webhook signature verification failed.`,
          error.message,
        );
        throw new BadRequestException();
      }
    }

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleCustomerSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.updated':
        await this.handleCustomerSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.handleCustomerSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.warn(`Unhandled event type ${event.type}`);
        break;
    }

    return { received: true };
  }

  private async handleCustomerSubscriptionCreated(
    stripeSubscription: Stripe.Subscription,
  ) {
    const trialStart = stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : undefined;
    const trialEnd = stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : undefined;
    const currentPeriodStart = new Date(
      stripeSubscription.items.data[0].current_period_start * 1000,
    );
    const currentPeriodEnd = new Date(
      stripeSubscription.items.data[0].current_period_end * 1000,
    );

    const user = await this.userService.findOneWithBalanceBy({
      id: stripeSubscription.metadata.userId,
    });

    if (!user) {
      throw new Error(
        `User ${stripeSubscription.metadata.userId} not found for subscription ${stripeSubscription.id}`,
      );
    }

    await this.userService.update(user, {
      stripeId: stripeSubscription.customer as string,
      subscription: {
        stripeId: stripeSubscription.id,
        status: stripeSubscription.status as SubscriptionStatuses,
        trialStart,
        trialEnd,
        currentPeriodStart,
        currentPeriodEnd,
        planId: stripeSubscription.metadata.planId,
        userId: stripeSubscription.metadata.userId,
      },
    });
  }

  private async handleCustomerSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ) {
    try {
      const trialStart = stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : undefined;
      const trialEnd = stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : undefined;
      const currentPeriodStart = new Date(
        stripeSubscription.items.data[0].current_period_start * 1000,
      );
      const currentPeriodEnd = new Date(
        stripeSubscription.items.data[0].current_period_end * 1000,
      );

      const subscription = await this.subscriptionService.findOneBy({
        stripeId: stripeSubscription.id,
      });

      if (!subscription) {
        this.logger.warn(
          `Received update for non-existent subscription: ${stripeSubscription.id}`,
        );
        await this.handleCustomerSubscriptionCreated(stripeSubscription);
        return;
      }

      await this.subscriptionService.update(subscription, {
        status: stripeSubscription.status as SubscriptionStatuses,
        trialStart,
        trialEnd,
        currentPeriodStart,
        currentPeriodEnd,
      });
    } catch (error: any) {
      this.logger.error(error);
      throw error;
    }
  }

  private async handleCustomerSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ) {
    await this.handleCustomerSubscriptionUpdated(stripeSubscription);
  }
}
