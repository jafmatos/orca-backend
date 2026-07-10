import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Plan,
  PlanDurationInterval,
} from '@/subscription/entities/plan.entity';
import { User } from '@/user/entities/user.entity';
import { SubscriptionStatuses } from '@/subscription/enums/subscription-status.enum';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_KEY');
    if (!stripeKey) {
      this.logger.warn(
        'STRIPE_KEY is not defined. Stripe integration will not work.',
      );
    }

    this.stripe = new Stripe(stripeKey || 'dummy_key');
  }

  public getStripeInstance(): Stripe {
    return this.stripe;
  }

  public async createSubscriptionPaymentLink({
    plan,
    user,
    ...props
  }: {
    plan: Plan;
    user: User;
  } & Pick<
    Stripe.Checkout.SessionCreateParams,
    'ui_mode' | 'success_url' | 'cancel_url'
  >) {
    const intervalMap = new Map<
      PlanDurationInterval,
      Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval
    >([
      [PlanDurationInterval.Yearly, 'year'],
      [PlanDurationInterval.Monthly, 'month'],
    ]);
    const interval = intervalMap.get(plan.duration.interval)!;

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          quantity: 1,
          price_data: {
            product_data: {
              name: plan.name,
            },
            currency: 'BRL',
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval,
              interval_count: plan.duration.intervalCount,
            },
          },
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
        trial_period_days: plan.trialPeriodDays || undefined,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'pause',
          },
        },
      },
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      ...props,
    });

    return session;
  }

  public async createBillingPortalSession({
    user,
    returnUrl,
  }: {
    user: User;
    returnUrl: string;
  }) {
    if (!user.stripeId) {
      throw new Error('User does not have a Stripe Customer ID');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: returnUrl,
    });

    return session;
  }

  public async getCustomerByEmail(email: string) {
    const customers = await this.stripe.customers.search({
      query: `email: '${email}'`,
      limit: 1,
    });
    return customers.data[0];
  }

  public async getCustomerSubscription(customerId: string) {
    const subscriptions = await this.stripe.subscriptions.search({
      query: `customer: '${customerId}'`,
      limit: 1,
    });
    return subscriptions.data[0];
  }

  public async getCustomerSubscriptionByUserId(userId: string) {
    const subscriptions = await this.stripe.subscriptions.search({
      query: `metadata["userId"]: '${userId}'`,
      limit: 1,
    });

    const nonCanceledSubscription = subscriptions.data.filter(
      (subscription) => subscription.status !== SubscriptionStatuses.Canceled,
    )[0];

    if (nonCanceledSubscription) return nonCanceledSubscription;

    return subscriptions.data[0];
  }
}
