import { Request, Response } from "express";
import { LimitService, ListOptions } from "Src/services/LimitService";
import { OverviewService, StatusOverviewWhere } from "Src/services/OverviewService";

export class OverviewController {
  public static async show(request: Request, response: Response) {
    const requestFilter = (request.query.filter as unknown as StatusOverviewWhere) || {
      when: {},
    };

    const status = await OverviewService.status({
      userId: request.auth!.user.id,
      when: {
        ge: requestFilter.when?.ge || request.auth!.user.periodGe,
        le: requestFilter.when?.le || request.auth!.user.periodLe,
      },
    });

    const history = await OverviewService.history({
      userId: request.auth!.user.id,
      months: parseInt(request.query.months as string) || 12,
    });

    const [limits] = await LimitService.list({
      filter: {
        userId: request.auth!.user.id,
        when: {
          ge: requestFilter.when?.ge || request.auth!.user.periodGe,
          le: requestFilter.when?.le || request.auth!.user.periodLe,
        },
      } as unknown as ListOptions["filter"],
    });

    return response.status(200).json({
      overview: {
        ...status,
        history,
      },
      limits,
    });
  }
}
