import { Request, Response } from "express";
import { UserRoles } from "Src/database/entities/User.entity";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { ValidationError } from "Src/helpers/Errors";
import { Jwt } from "Src/helpers/Jwt";
import { CreateUserAttributes, UserService } from "Src/services/UserService";
import z from "zod";

export class SignUpController {
  public static async store(request: Request, response: Response) {
    const { data: body, error } = await z
      .object({
        name: z.string(),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha curta demais"),
        role: z.string().default(UserRoles.User),
      })
      .refine(
        async (body) => {
          const isEmailInUse = await UserService.exists({ email: body.email });

          return !isEmailInUse;
        },
        { path: ["email"], message: "Este email já está em uso" }
      )
      .transform((body) => {
        if (body.password) body.password = Bcrypt.hash(body.password);

        return body;
      })
      .safeParseAsync(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const defaultPeriodGe = new Date();
    const defaultPeriodLe = new Date();

    defaultPeriodGe.setHours(0, 0, 0, 0);

    defaultPeriodLe.setMonth(defaultPeriodLe.getMonth() + 1);
    defaultPeriodLe.setHours(0, 0, 0, 0);

    const user = await UserService.create({
      ...body,
      periodGe: defaultPeriodGe,
      periodLe: defaultPeriodLe,
    } as CreateUserAttributes);
    const token = Jwt.sign({
      id: user.id,
      role: user.role,
    });

    return response.status(200).json({
      user,
      token,
    });
  }
}
