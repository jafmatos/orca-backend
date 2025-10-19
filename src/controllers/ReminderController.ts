import { Request, Response } from "express";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { EntryService } from "Src/services/EntryService";
import { eventBus } from "Src/services/Events";
import { ListOptions, ReminderService } from "Src/services/ReminderService";
import { EntryTypes } from "Src/types/EntryTypes";
import { IsNull } from "typeorm";
import z from "zod";

const zodOptionalCategorySchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
      .optional(),
  })
  .or(z.undefined());

export class ReminderController {
  public static async index(request: Request, response: Response) {
    const requestFilter = request.query.filter as unknown as ListOptions["filter"];

    const [reminders, count] = await ReminderService.list({
      filter: {
        ...requestFilter,
        userId: request.auth!.user.id,
      },
      pagination: request.pagination!.toQuery(),
    });

    return response.status(200).json({
      data: reminders,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }

  public static async show(request: Request, response: Response) {
    const reminder = await ReminderService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!reminder) throw new NotFoundError("Lembrete não encontrado");

    return response.status(200).json({ reminder });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        type: z.enum(EntryTypes),
        description: z.string().max(255, "A descrição deve ter no máximo 255 caracteres").optional(),
        amount: z.number("Informe um valor").min(0, "O valor não pode ser negativo").optional(),
        referenceDateTime: z.iso.datetime("Informe um dia do mês e horário"),
        category: zodOptionalCategorySchema.optional().or(z.null()),
        createEntryAutomatically: z.boolean().optional().default(false),
        isActive: z.boolean().optional().default(true),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const category =
      body.category &&
      (await CategoryService.findOneBy({
        id: body.category.id,
        removedAt: IsNull(),
        userId: request.auth!.user.id,
      }));

    if (body.category?.id && !category) throw new NotFoundError("Categoria não encontrada");

    const reminder = await ReminderService.create({
      ...body,
      category,
      user: request.auth!.user,
      userId: request.auth!.user.id,
    });

    await eventBus.triggerAsync("reminder:created", reminder);

    return response.status(200).json({ reminder });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        type: z.enum(EntryTypes).optional(),
        description: z.string().max(255, "A descrição deve ter no máximo 255 caracteres").optional(),
        amount: z.number("Informe um valor").min(0, "O valor não pode ser negativo").optional(),
        referenceDateTime: z.iso.datetime("Informe um dia do mês e horário").optional(),
        category: zodOptionalCategorySchema.optional().or(z.null()).optional(),
        createEntryAutomatically: z.boolean().optional().default(false),
        isActive: z.boolean().optional().default(true),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const reminder = await ReminderService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!reminder) throw new NotFoundError("Lembrete não encontrado");

    const category =
      body.category &&
      (await CategoryService.findOneBy({
        id: body.category.id,
        removedAt: IsNull(),
        userId: request.auth!.user.id,
      }));

    if (body.category?.id && !category) throw new NotFoundError("Categoria não encontrada");

    await eventBus.triggerAsync("reminder:before-update", reminder);

    const updatedReminder = await ReminderService.update(reminder, {
      ...body,
      category,
    });

    await eventBus.triggerAsync("reminder:updated", updatedReminder);

    return response.status(200).json({ reminder: updatedReminder });
  }

  public static async destroy(request: Request, response: Response) {
    const reminder = await ReminderService.findOneBy({
      id: request.params.id,
      userId: request.auth!.user.id,
    });

    if (!reminder) throw new NotFoundError("Lembrete não encontrado");

    await eventBus.triggerAsync("reminder:before-remove", reminder);

    const removedReminder = await ReminderService.softRemove(reminder);

    return response.status(200).json({ reminder: removedReminder });
  }
}
