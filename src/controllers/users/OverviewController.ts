import { Request, Response } from "express";
import { CategoryService, ListOptions } from "Src/services/CategoryService";
import { FindOverviewWhere, OverviewService } from "Src/services/OverviewService";

export class OverviewController {
  public static async show(request: Request, response: Response) {
    const requestFilter = (request.query.filter as unknown as FindOverviewWhere) || {
      when: {},
    };

    const overview = await OverviewService.find({
      userId: request.auth!.user.id,
      when: {
        ge: requestFilter.when?.ge || request.auth!.user.periodGe,
        le: requestFilter.when?.le || request.auth!.user.periodLe,
      },
    });

    const categories = await CategoryService.list({
      filter: {
        userId: request.auth!.user.id,
        when: {
          ge: requestFilter.when?.ge || request.auth!.user.periodGe,
          le: requestFilter.when?.le || request.auth!.user.periodLe,
        },
      } as unknown as ListOptions["filter"],
      order: request.query.order as unknown as ListOptions["order"],
    });

    return response.status(200).json({ overview, categories });
  }
}
