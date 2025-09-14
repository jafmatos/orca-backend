import { Request, Response } from "express";
import { PlanService } from "Src/services/PlanService";

export class PlanController {
  public static async index(request: Request, response: Response) {
    const plans = await PlanService.findAll();

    return response.status(200).json({
      plans,
    });
  }
}
