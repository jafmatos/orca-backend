import { Request, Response } from "express";
import { ConflictError, NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { LimitService, ListOptions } from "Src/services/LimitService";
import { CategoryTypes } from "Src/types/CategoryTypes";
import { IsNull } from "typeorm";
import { z } from "zod";

const zodCategorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
    .optional(),
});

export class LimitController {
  public static async index(request: Request, response: Response) {
    const requestFilter = (request.query.filter as ListOptions["filter"]) || {
      when: {},
    };

    const [limits, count] = await LimitService.list({
      filter: {
        userId: request.auth!.user.id,
        when: {
          ge: requestFilter.when?.ge || request.auth!.user.periodGe,
          le: requestFilter.when?.le || request.auth!.user.periodLe,
        },
      } as ListOptions["filter"],
      pagination: request.pagination!.toQuery(),
    });

    return response.status(200).json({
      data: limits,
      meta: { count, pages: Math.ceil(10 / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }

  public static async show(request: Request, response: Response) {
    const limit = await LimitService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!limit) throw new NotFoundError("Limite não encontrado");

    return response.status(200).json({ category: limit });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        category: zodCategorySchema,
        amount: z.number().min(0),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    if (body.category.id) {
      const category = await CategoryService.findOneBy({
        id: body.category.id,
        removedAt: IsNull(),
        userId: request.auth!.user.id,
        type: CategoryTypes.Expense,
      });

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const existingLimit = await LimitService.findOneBy({
      categoryId: body.category.id,
      userId: request.auth!.user.id,
    });

    if (existingLimit) throw new ConflictError("Já existe um limite para esta categoria");

    const limit = await LimitService.create({
      ...body,
      userId: request.auth!.user.id,
    });

    return response.status(200).json({ limit });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        category: zodCategorySchema.or(z.undefined()),
        amount: z.number().min(0).optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const limit = await LimitService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!limit) throw new NotFoundError("Limite não encontrado");

    if (body.category?.id) {
      const category = await CategoryService.findOneBy({
        id: body.category.id,
        removedAt: IsNull(),
        userId: request.auth!.user.id,
        type: CategoryTypes.Expense,
      });

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const updatedLimit = await LimitService.update(limit, body);

    return response.status(200).json({ limit: updatedLimit });
  }

  public static async destroy(request: Request, response: Response) {
    const limit = await LimitService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!limit) throw new NotFoundError("Limite não encontrado");

    await LimitService.remove(limit);

    return response.status(200).end();
  }
}
