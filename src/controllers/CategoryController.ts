import { Request, Response } from "express";
import { NotFoundError, ValidationError } from "Src/helpers/Errors";
import { CategoryService } from "Src/services/CategoryService";
import { z } from "zod";

export class CategoryController {
  public static async index(request: Request, response: Response) {
    const categories = await CategoryService.list({
      withDeleted: request.query.withDeleted === "true",
    });

    return response.status(200).json({ data: categories });
  }

  public static async show(request: Request, response: Response) {
    const category = await CategoryService.findById(request.params.id);

    if (!category) throw new NotFoundError("Categoria não encontrada");

    return response.status(200).json({ category });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        name: z.string().transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase())),
        mark: z.number().min(0).optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const category = await CategoryService.create(body);

    return response.status(200).json({ category });
  }

  public static async update(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        name: z
          .string()
          .transform((v) => v.toLowerCase().replace(/^./, v[0].toUpperCase()))
          .optional(),
        mark: z.number().min(0).optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const category = await CategoryService.findById(request.params.id);

    if (!category) throw new NotFoundError("Categoria não encontrada");

    const updatedCategory = await CategoryService.update(category, body);

    return response.status(200).json({ category: updatedCategory });
  }

  public static async destroy(request: Request, response: Response) {
    const category = await CategoryService.findById(request.params.id);

    if (!category) throw new NotFoundError("Categoria não encontrada");

    await CategoryService.softRemove(category);

    return response.status(200).end();
  }

  public static async recover(request: Request, response: Response) {
    const category = await CategoryService.findById(request.params.id);

    if (!category) throw new NotFoundError("Categoria não encontrada");

    await CategoryService.recover(category);

    return response.status(200).end();
  }
}
