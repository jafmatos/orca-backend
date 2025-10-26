import { Request, Response } from "express";
import { ConflictError, NotFoundError, TeapotError, ValidationError } from "Src/helpers/Errors";
import { PlanService } from "Src/services/PlanService";
import { StripeService } from "Src/services/StripeService";
import { SubscriptionService } from "Src/services/SubscriptionService";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";
import z from "zod";

export class StripeCheckoutController {
  public static async store(request: Request, response: Response) {
    const authUser = request.auth!.user!;
    const { data: body, error } = z
      .object({
        planId: z.uuid({
          version: "v4",
        }),
        success_url: z.string(),
        cancel_url: z.string(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    if (authUser.subscription && authUser.subscription?.status !== SubscriptionStatuses.Canceled)
      throw new ConflictError("Você já tem uma assinatura ativa.");

    const plan = await PlanService.findById(body.planId);

    if (!plan) throw new NotFoundError("Plano não encontrado");

    const session = await StripeService.createSubscriptionPaymentLink({
      plan,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      user: request.auth!.user,
    });

    return response.status(200).json({
      session,
    });
  }

  public static async update(request: Request, response: Response) {
    const authUser = request.auth!.user!;
    const subscription = await StripeService.getCustomerSubscriptionByUserId(authUser.id);

    if (!subscription) throw new TeapotError("Pagamento não processado");

    const trialStart = subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined;
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined;

    const existingSubscription = await SubscriptionService.findOne({
      stripeId: subscription.id,
    });

    if (existingSubscription?.isValid) {
      return response.status(200).json({
        message: "Você já tem uma assinatura ativa",
      });
    }

    if (existingSubscription) {
      const updatedSubscription = await SubscriptionService.update(existingSubscription, {
        status: subscription.status as SubscriptionStatuses,
        trialStart,
        trialEnd,
      });

      return response.status(200).json({ subscription: updatedSubscription });
    }

    const createdSubscription = await SubscriptionService.create({
      stripeId: subscription.id,
      status: subscription.status as SubscriptionStatuses,
      trialStart,
      trialEnd,
      planId: subscription.metadata.planId,
      userId: subscription.metadata.userId,
    });

    return response.status(200).json({ subscription: createdSubscription });
  }
}
