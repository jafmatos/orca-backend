import { Request, Response } from "express";
import { ConflictError, NotFoundError, ValidationError } from "Src/helpers/Errors";
import { PlanService } from "Src/services/PlanService";
import { StripeService } from "Src/services/StripeService";
import { SubscriptionStatuses } from "Src/types/SubscriptionStatuses";
import z from "zod";

export class StripeCheckoutController {
	public static async store(request: Request, response: Response) {
		const authUser = request.auth!.user!
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

		if (authUser.subscription && authUser.subscription?.status !== SubscriptionStatuses.Canceled) throw new ConflictError("Você já tem uma assinatura ativa.");

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
}
