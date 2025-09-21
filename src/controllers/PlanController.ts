import { Request, Response } from "express";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { PlanService } from "Src/services/PlanService";
import z from "zod";

export class PlanController {
  public static async index(request: Request, response: Response) {
    const plans = await PlanService.findAll();

    return response.status(200).json({
      plans,
    });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        name: z.string(),
        price: z.number("Informe um valor").min(0, "O valor não pode ser negativo"),
        trialPeriodDays: z.number().int().min(0).optional(),
        benefits: z.array(z.string()),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const plan = await PlanService.create(body);

    return response.status(200).json({
      plan,
    });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        name: z.string().optional(),
        price: z.number("Informe um valor").min(0, "O valor não pode ser negativo").optional(),
        trialPeriodDays: z.number().int().min(0).optional(),
        benefits: z.array(z.string()).optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const plan = await PlanService.findById(request.params.id);

    if (!plan) throw new NotFoundError("Plano não encontrado");

    const updatedPlan = await PlanService.update(plan, body);

    return response.status(200).json({
      plan: updatedPlan,
    });
  }

  public static async destroy(request: Request, response: Response) {
    const plan = await PlanService.findById(request.params.id);

    if (!plan) throw new NotFoundError("Plano não encontrado");

    const removedPlan = await PlanService.remove(plan);

    return response.status(200).json({
      plan: removedPlan,
    });
  }
}
