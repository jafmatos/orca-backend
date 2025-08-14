import { Request, Response } from "express";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { ExpenseService } from "Src/services/ExpenseService";
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

export class ExpenseController {
  public static async index(request: Request, response: Response) {
    const [expenses, count] = await ExpenseService.list({
      pagination: request.pagination!.toQuery(),
      order: (request.query.order as any) || { column: "when", mode: "DESC" },
      filter: request.query.filter as any,
    });

    return response.status(200).json({
      data: expenses,
      meta: { count, pages: Math.ceil(count / request.pagination!.toQuery().take!), ...request.pagination?.toResponse() },
    });
  }

  public static async sumUp(request: Request, response: Response) {
    const sumUp = await ExpenseService.sumUp({
      filter: request.query.filter as any,
      order: request.query.order as any,
    });

    return response.status(200).json(sumUp);
  }

  public static async show(request: Request, response: Response) {
    const expense = await ExpenseService.findById(request.params.id);

    if (!expense) throw new NotFoundError("Despesa não encontrada");

    return response.status(200).json({ expense });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        amount: z.number("Informe um valor").min(0, "O valor não pode ser negativo"),
        description: z.string().optional(),
        when: z.iso.datetime("Informe uma data"),
        category: zodOptionalCategorySchema.optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    if (body.category?.id) {
      const category = await CategoryService.findById(body.category.id);

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const expense = await ExpenseService.create(body);

    return response.status(200).json({ expense });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        when: z.iso.datetime().optional(),
        category: zodOptionalCategorySchema.optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const expense = await ExpenseService.findById(request.params.id);

    if (!expense) throw new NotFoundError("Despesa não encontrada");

    if (body.category?.id) {
      const category = await CategoryService.findById(body.category.id);

      if (!category) throw new NotFoundError("Categoria não encontrada");
    }

    const updatedExpense = await ExpenseService.update(expense, body);

    return response.status(200).json({ expense: updatedExpense });
  }

  public static async destroy(request: Request, response: Response) {
    const expense = await ExpenseService.findById(request.params.id);

    if (!expense) throw new NotFoundError("Despesa não encontrada");

    const removedExpense = await ExpenseService.remove(expense);

    return response.status(200).json({ expense: removedExpense });
  }
}
