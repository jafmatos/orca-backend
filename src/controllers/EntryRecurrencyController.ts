import { Request, Response } from "express";
import { EntryRecurrencyService } from "Src/services/EntryRecurrencyService";
import { EntryService } from "Src/services/EntryService";

export class EntryRecurrencyController {
  public static async index(request: Request, response: Response) {
    // const [recurrencies, count] = await EntryService.listRecurrent({
    //   pagination: request.pagination!.toQuery(),
    //   filter: {
    //     userId: request.auth!.user.id,
    //   },
    // });

    // return response.status(200).json({
    //   data: recurrencies,
    //   meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    // });
    // const recurrencies = await EntryService.listRecurrent({
    //   pagination: request.pagination!.toQuery(),
    //   filter: {
    //     userId: request.auth!.user.id,
    //   },
    // });

    const [recurrencies, count] = await EntryRecurrencyService.list({
      filter: {
        userId: request.auth!.user.id,
      },
      pagination: request.pagination!.toQuery(),
    });

    return response.status(200).json({
      data: recurrencies,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }
}
