import { Request, Response } from "express";
import { UserService } from "Src/services/UserService";

export class UserController {
  public static async index(request: Request, response: Response) {
    const [users, count] = await UserService.find({
      filter: request.query.filter as object,
      order: (request.query.order as any) || {
        entity: "user",
        column: "name",
        mode: "ASC",
      },
      pagination: request.pagination!.toQuery(),
    });

    return response.status(200).json({
      data: users,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }
}
