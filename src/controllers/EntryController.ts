import { Request, Response } from "express";
import { RecurrencyActions, RecurrencyTypes } from "Src/database/entities/EntryRecurrency.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { EntryRecurrencyService } from "Src/services/EntryRecurrencyService";
import { EntryService, ListOptions } from "Src/services/EntryService";
import { eventBus } from "Src/services/Events";
import { CategoryTypes } from "Src/types/CategoryTypes";
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
    const requestFilter = (request.query.filter as ListOptions["filter"]) || {
      when: {},
    };

    const [entries, count] = await EntryService.list({
      pagination: request.pagination!.toQuery(),
      order: (request.query.order as any) || { column: "when", mode: "DESC" },
      filter: {
        ...requestFilter,
        userId: request.auth!.user.id,
        when: {
          ge: requestFilter.when?.ge || request.auth!.user.periodGe,
          le: requestFilter.when?.le || request.auth!.user.periodLe,
        },
      } as ListOptions["filter"],
    });

    return response.status(200).json({
      data: entries,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
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
        recurrency: z
          .object({
            id: z.undefined().or(z.string()),
            userId: z.undefined().transform(() => request.auth!.user.id),
            type: z.enum(RecurrencyTypes),
            action: z.enum(RecurrencyActions),
          })
          .or(z.null())
          .optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    if (body.category?.id) {
      const category = await CategoryService.findOneBy({
        id: body.category.id,
        removedAt: IsNull(),
        userId: request.auth!.user.id,
        type: body.type as unknown as CategoryTypes,
      });

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const entry = await EntryService.create({
      ...body,
      userId: request.auth!.user.id,
    });

    if (body.recurrency) {
      await eventBus.triggerAsync("entry-recurrency:created", entry);
    }

    return response.status(200).json({ entry });
  }

  public static async update(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = z
        .object({
          type: z.enum(EntryTypes).optional(),
          amount: z.number().min(0, "O valor não pode ser negativo").optional(),
          description: z.string().max(255, "A descrição deve ter no máximo 255 caracteres").optional(),
          when: z.iso.datetime().optional(),
          category: zodOptionalCategorySchema.optional().or(z.null()),
          recurrency: z
            .object({
              id: z.undefined().or(z.string()),
              userId: z.undefined().transform(() => request.auth!.user.id),
              type: z.enum(RecurrencyTypes),
              action: z.enum(RecurrencyActions),
            })
            .or(z.null())
            .optional(),
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
          type: (body.type || entry.type) as unknown as CategoryTypes,
        });

        if (!category) throw new NotFoundError("Categoria não encontrada");
      }

      if (entry.recurrency) {
        await eventBus.triggerAsync("entry-recurrency:before-update", entry);
      }

      if (entry.recurrency && body.recurrency) {
        await EntryRecurrencyService.update(entry.recurrency, body.recurrency, { transaction });

        delete body.recurrency;
      }

      const updatedEntry = await EntryService.update(entry, body, { transaction });

      if (updatedEntry.recurrency) {
        await eventBus.triggerAsync("entry-recurrency:updated", updatedEntry);
      }

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({ entry: updatedEntry });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }

  public static async destroy(request: Request, response: Response) {
    const entry = await EntryService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!entry) throw new NotFoundError("Despesa não encontrada");

    if (entry.recurrency) {
      await eventBus.triggerAsync("entry-recurrency:before-remove", entry);
    }

    const removedEntry = await EntryService.softRemove(entry);

    return response.status(200).json({ entry: removedEntry });
  }
}
