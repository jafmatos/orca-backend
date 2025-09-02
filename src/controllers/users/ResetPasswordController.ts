import { Request, Response } from "express";
import { UserRoles } from "Src/database/entities/User.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { NotFoundError, TeapotError, ValidationError } from "Src/helpers/Errors";
import { Jwt } from "Src/helpers/Jwt";
import { Nodemailer } from "Src/helpers/Nodemailer";
import { UserKeyService } from "Src/services/UserKeyService";
import { CreateUserAttributes, UserService } from "Src/services/UserService";
import { KeyTypes } from "Src/types/KeyTypes";
import z from "zod";

export class ResetPasswordController {
  public static async store(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = await z
        .object({
          confirmUrl: z.string().url(),
          email: z.string().email("Email inválido"),
        })
        .refine(
          async (body) => {
            const isEmailInUse = await UserService.exists({ email: body.email });

            return isEmailInUse;
          },
          { path: ["email"], message: "Não existe uma conta com este E-mail" }
        )
        .safeParseAsync(request.body);

      if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

      const user = await UserService.findOneBy({
        email: body.email,
      });

      const otp = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0");
      const userKey = await UserKeyService.create(
        {
          userId: user!.id,
          type: KeyTypes.ResetPassword,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000), // 5 minutes
        },
        {
          transaction,
        }
      );

      await Nodemailer.send({
        from: process.env.SMTP_ORIGIN!,
        to: user!.email,
        subject: "Recuperação de senha",
        html: `<p><b>Código de confirmação: </b>${otp}</p><a href="${body.confirmUrl}/${userKey.id}">Continuar</a>`,
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({
        user,
        key: userKey,
        confirmUrl: `${body.confirmUrl.replace(/\d/, "")}/${userKey.id}`,
      });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }

  public static async update(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = z
        .object({
          otp: z.string(),
          password: z.string().min(6, "Senha curta demais"),
          passwordConfirmation: z.string().min(6, "Confirmação curta demais"),
        })
        .refine(
          (body) => {
            return body.password === body.passwordConfirmation;
          },
          { path: ["passwordConfirmation"], message: "Confirmação incorreta" }
        )
        .safeParse(request.body);

      if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

      const key = await UserKeyService.findById(request.params.id);

      if (!key) throw new NotFoundError("Chave de acesso não encontrada");

      if (!Bcrypt.compare(body.otp, key.otp) || (key.expiresAt && new Date() > new Date(key.expiresAt)))
        throw new TeapotError("Código incorreto ou expirado");

      const user = await UserService.findOneBy({
        id: key.userId,
      });

      if (!user) throw new NotFoundError("Usuário não encontrado");

      const updatedUser = await UserService.update(
        user,
        {
          password: Bcrypt.hash(body.password),
          lastLoggedIn: new Date().toISOString(),
        },
        {
          transaction,
        }
      );

      await UserKeyService.remove(key, { transaction });

      await transaction.commit();
      await transaction.release();

      const token = Jwt.sign({
        id: user.id,
        role: user.role,
      });

      return response.status(200).json({ user: updatedUser, token });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }
}
