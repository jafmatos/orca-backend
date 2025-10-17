import { Request, Response } from "express";
import { ValidationError } from "Src/helpers/Errors";
import { PushSubscriptionService } from "Src/services/PushSubcriptionService";
import z from "zod";

export class PushSubscriptionController {
  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    await PushSubscriptionService.create({
      ...body,
      userId: request.auth!.user.id,
    });

    return response.status(200).end();
  }
}
