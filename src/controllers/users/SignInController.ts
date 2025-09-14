import { Request, Response } from "express";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { ConflictError, TeapotError, UnauthorizedAccessError, ValidationError } from "Src/helpers/Errors";
import { Jwt } from "Src/helpers/Jwt";
import { UserService } from "Src/services/UserService";
import z from "zod";

export class SignInController {
  public static async show(request: Request, response: Response) {
    const user = request.auth?.user;

    if (!user) throw new UnauthorizedAccessError();

    return response.status(200).json({
      user,
    });
  }

  public static async store(request: Request, response: Response) {
    const { data: body, error } = z
      .object({
        email: z.string().email("Email inválido"),
        password: z.string(),
      })

      .safeParse(request.body);

    if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

    const user = await UserService.findOneBy({ email: body.email });

    if (!user || !Bcrypt.compare(body.password, user.password)) throw new TeapotError("Credenciais inválidas");

    if (!user.isEmailConfirmed)
      throw new ConflictError("Você precisa confirmar o E-mail antes de acessar sua conta. Verifique sua caixa de entrada!");

    await UserService.update(user, {
      lastLoggedIn: new Date().toISOString(),
    });

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
