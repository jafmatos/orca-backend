import { Request, Response } from "express";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { EntryService } from "Src/services/EntryService";
import { EntryTypes } from "Src/types/EntryTypes";
import { IsNull } from "typeorm";
import { z } from "zod";

const zodOptionalCategorySchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
      .optional(),
  })
  .or(z.undefined());

export class EntryController {
  public static async index(request: Request, response: Response) {
    if (!(request.query.filter as any)?.userId) {
      request.query.filter = {
        ...((request.query.filter as unknown as object) || {}),
        userId: request.auth!.user.id,
      };
    }

    const [entries, count] = await EntryService.list({
      pagination: request.pagination!.toQuery(),
      order: (request.query.order as any) || { column: "when", mode: "DESC" },
      filter: request.query.filter as any,
    });

    return response.status(200).json({
      data: entries,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }

  public static async sumUp(request: Request, response: Response) {
    if (!(request.query.filter as any)?.userId) {
      request.query.filter = {
        ...((request.query.filter as unknown as object) || {}),
        userId: request.auth!.user.id,
      };
    }

    const sumUp = await EntryService.sumUp({
      filter: request.query.filter as any,
      order: request.query.order as any,
    });

    return response.status(200).json(sumUp);
  }

  public static async show(request: Request, response: Response) {
    const entry = await EntryService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!entry) throw new NotFoundError("Despesa não encontrada");

    return response.status(200).json({ entry });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        type: z.enum(EntryTypes),
        amount: z.number("Informe um valor").min(0, "O valor não pode ser negativo"),
        description: z.string().max(255, "A descrição deve ter no máximo 255 caracteres").optional(),
        when: z.iso.datetime("Informe uma data"),
        category: zodOptionalCategorySchema.optional().or(z.null()),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    if (body.category?.id) {
      const category = await CategoryService.findOneBy({
        id: body.category.id,
        deletedAt: IsNull(),
        userId: request.auth!.user.id,
      });

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const entry = await EntryService.create({
      ...body,
      userId: request.auth!.user.id,
    });

    return response.status(200).json({ entry });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        type: z.enum(EntryTypes).optional(),
        amount: z.number().min(0, "O valor não pode ser negativo").optional(),
        description: z.string().max(255, "A descrição deve ter no máximo 255 caracteres").optional(),
        when: z.iso.datetime().optional(),
        category: zodOptionalCategorySchema.optional().or(z.null()),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const entry = await EntryService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!entry) throw new NotFoundError("Despesa não encontrada");

    if (body.category?.id) {
      const category = await CategoryService.findOneBy({
        id: body.category.id,
        userId: request.auth!.user.id,
      });

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const updatedEntry = await EntryService.update(entry, body);

    return response.status(200).json({ entry: updatedEntry });
  }

  public static async destroy(request: Request, response: Response) {
    const entry = await EntryService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!entry) throw new NotFoundError("Despesa não encontrada");

    const removedEntry = await EntryService.remove(entry);

    return response.status(200).json({ entry: removedEntry });
  }
}
