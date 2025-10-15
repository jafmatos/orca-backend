import { Request, Response } from "express";
import { ConflictError, UnauthorizedAccessError, ValidationError } from "Src/helpers/Errors";
import { UserService } from "Src/services/UserService";
import z from "zod";

export class UserController {
  public static async update(request: Request, response: Response) {
    const user = request.auth!.user;

    if (!user) throw new UnauthorizedAccessError();

    const { data: body, error } = z
      .object({
        name: z.string().optional(),
        periodGe: z.string().datetime().optional(),
        periodLe: z.string().datetime().optional(),
        periodReferenceDay: z.number().int().optional(),
      })
      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const mergedUser = UserService.userRepository.merge(user, body);

    if (mergedUser.periodGe > mergedUser.periodLe) throw new ConflictError("A data de início não pode ser maior que a de fechamento");

    await UserService.update(user, body);

    const updatedUser = await UserService.findOneBy({
      id: user.id,
    });

    return response.status(200).json({
      user: updatedUser,
    });
  }
}
