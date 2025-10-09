import { Plan } from "Src/database/entities/Plan.entity";
import { User } from "Src/database/entities/User.entity";
import { Stripe } from "stripe";

export const stripe = new Stripe(process.env.STRIPE_KEY!);

export class StripeService {
  public static async createSubscriptionPaymentLink({
    plan,
    user,
    success_url,
    cancel_url,
  }: {
    plan: Plan;
    user: User;
    success_url: string;
    cancel_url: string;
  }) {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          quantity: 1,
          price_data: {
            product_data: {
              name: plan.name,
            },
            currency: "BRL",
            unit_amount: plan.price * 100,
            recurring: {
              interval: "month",
              interval_count: 1,
            },
          },
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
        trial_period_days: plan.trialPeriodDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: "pause",
          },
        },
      },
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      success_url,
      cancel_url,
    });

    return session;
  }

  public static async createBillingPortalSession({ user, returnUrl }: { user: User; returnUrl: string }) {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeId!,
      return_url: returnUrl,
    });

    return session;
  }
}
