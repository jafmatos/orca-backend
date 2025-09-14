import { Request, Response } from "express";
import { ValidationError } from "Src/helpers/Errors";
import { stripe, StripeService } from "Src/services/StripeService";
import z from "zod";

export class StripeBillingPortalsController {
  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        returnUrl: z.string(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const session = await StripeService.createBillingPortalSession({ user: request.auth!.user, returnUrl: body.returnUrl });

    return response.status(200).json({ session });
  }
}
