import { Request, Response } from "express";
import { logger } from "Src/infra/Logger";
import { stripe } from "Src/services/StripeService";
import { SubscriptionService } from "Src/services/SubscriptionService";
import { UserService } from "Src/services/UserService";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";
import Stripe from "stripe";

export class StripeWebhookHandler {
  public static async handleCustomerSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
    const trialStart = stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined;
    const trialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined;

    const user = await UserService.findOneBy({
      id: stripeSubscription.metadata.userId,
    });

    if (!user) {
      throw new Error(`User ${stripeSubscription.metadata.userId} not found for subscription ${stripeSubscription.id}`);
    }

    await UserService.update(user, {
      stripeId: stripeSubscription.customer as string,
      subscription: {
        stripeId: stripeSubscription.id,
        status: stripeSubscription.status as SubscriptionStatuses,
        trialStart,
        trialEnd,
        planId: stripeSubscription.metadata.planId,
        userId: stripeSubscription.metadata.userId,
      },
    });
  }

  public static async handleCustomerSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    try {
      const trialStart = stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined;
      const trialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined;
      const subscription = await SubscriptionService.findOne({
        stripeId: stripeSubscription.id,
      });

      if (!subscription) {
        console.warn(`Received update for non-existent subscription: ${stripeSubscription.id}`);

        await this.handleCustomerSubscriptionCreated(stripeSubscription);

        return;
      }

      await SubscriptionService.update(subscription, {
        status: stripeSubscription.status as SubscriptionStatuses,
        trialStart,
        trialEnd,
      });
    } catch (error: any) {
      logger.error(error);

      throw error;
    }
  }

  public static async handleCustomerSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    await this.handleCustomerSubscriptionUpdated(stripeSubscription);
  }
}

export class StripeWebhookController {
  private static endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

  public static async store(request: Request, response: Response) {
    let event = request.body;

    if (this.endpointSecret) {
      const signature = request.headers["stripe-signature"] as string;

      try {
        event = stripe.webhooks.constructEvent(request.body, signature, this.endpointSecret);
      } catch (error: any) {
        logger.error(`⚠️  Webhook signature verification failed.`, error.message);
        return response.sendStatus(400);
      }
    }

    switch (event.type) {
      case "customer.subscription.created":
        await StripeWebhookHandler.handleCustomerSubscriptionCreated(event.data.object);

        break;
      case "customer.subscription.updated":
        await StripeWebhookHandler.handleCustomerSubscriptionUpdated(event.data.object);

        break;
      case "customer.subscription.deleted":
        await StripeWebhookHandler.handleCustomerSubscriptionDeleted(event.data.object);

        break;

      default:
        logger.warn(`Unhandled event type ${event.type}`);

        break;
    }

    return response.json({ received: true });
  }
}
