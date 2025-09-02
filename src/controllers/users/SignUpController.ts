import { Request, Response } from "express";
import { UserRoles } from "Src/database/entities/User.entity";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { ConflictError, NotFoundError, TeapotError, ValidationError } from "Src/helpers/Errors";
import { Jwt } from "Src/helpers/Jwt";
import { Nodemailer } from "Src/helpers/Nodemailer";
import { UserKeyService } from "Src/services/UserKeyService";
import { CreateUserAttributes, UserService } from "Src/services/UserService";
import { KeyTypes } from "Src/types/KeyTypes";
import z from "zod";

function confirmMail(otp: string, url: string, key: string) {
  return `<p><b>Código de confirmação: </b>${otp}</p><a href="${url}/${key}">Confirmar cadastro</a>`;
}

export class SignUpController {
  public static async store(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = await z
        .object({
          confirmUrl: z.string().url(),
          name: z.string(),
          email: z.string().email("Email inválido"),
          password: z.string().min(6, "Senha curta demais"),
          passwordConfirmation: z.string().min(6, "Confirmação curta demais"),
        })
        .superRefine(async (body, ctx) => {
          if (body.password !== body.passwordConfirmation) {
            ctx.addIssue({
              path: ["passwordConfirmation"],
              message: "Confirmação incorreta",
              code: z.ZodIssueCode.custom,
            });
          }
        })
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

      const existingUser = await UserService.findOneBy({
        email: body.email,
      });

      if (existingUser?.isActive) throw new ConflictError("Sua conta já está ativa");

      const user = existingUser
        ? await UserService.update(existingUser, {
            name: body.name,
            email: body.email,
            password: body.password,
            periodGe: defaultPeriodGe,
            periodLe: defaultPeriodLe,
          })
        : await UserService.create(
            {
              name: body.name,
              email: body.email,
              password: body.password,
              periodGe: defaultPeriodGe,
              periodLe: defaultPeriodLe,
              isActive: false,
            } as CreateUserAttributes,
            {
              transaction,
            }
          );

      await UserKeyService.delete({
        userId: user.id,
      });

      const otp = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0");
      const userKey = await UserKeyService.create(
        {
          userId: user.id,
          type: KeyTypes.SignUp,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000), // 5 minutes
        },
        {
          transaction,
        }
      );

      await Nodemailer.send({
        from: process.env.SMTP_ORIGIN!,
        to: user.email,
        subject: "Confirmação de E-mail",
        html: confirmMail(otp, body.confirmUrl, userKey.id),
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({
        key: userKey,
        confirmUrl: `${body.confirmUrl.replace(/\d/, "")}?key=${userKey.id}`,
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
        })
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
          isActive: true,
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

  public static async resend(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = z
        .object({
          confirmUrl: z.string().url(),
        })
        .safeParse(request.body);

      if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

      const key = await UserKeyService.findById(request.params.id);

      if (!key) throw new NotFoundError("Chave de acesso não encontrada");

      const otp = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0");

      const userKey = await UserKeyService.update(
        key,
        {
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000), // 5 minutes
        },
        {
          transaction,
        }
      );

      await Nodemailer.send({
        from: process.env.SMTP_ORIGIN!,
        to: key.user!.email,
        subject: "Confirmação de E-mail",
        html: confirmMail(otp, body.confirmUrl, userKey.id),
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({
        key: userKey,
        confirmUrl: `${body.confirmUrl.replace(/\d/, "")}?key=${userKey.id}`,
      });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }
}
