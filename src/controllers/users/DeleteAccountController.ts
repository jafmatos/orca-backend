import { Request, Response } from "express";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { Bcrypt } from "Src/helpers/Bcrypt";
import { NotFoundError, TeapotError, ValidationError } from "Src/helpers/Errors";
import { Otp } from "Src/helpers/Otp/Otp";
import { EmailService } from "Src/services/Email/EmailService";
import { stripe } from "Src/services/StripeService";
import { UserKeyService } from "Src/services/UserKeyService";
import { UserService } from "Src/services/UserService";
import { KeyTypes } from "Src/types/KeyTypes";
import z from "zod";

export class DeleteAccountController {
  public static async store(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const { data: body, error } = z
        .object({
          confirmUrl: z.string().url(),
        })
        .safeParse(request.body);

      if (error) throw new ValidationError(error.message, ValidationError.fromZod(error));

      const user = request.auth!.user!;

      await UserKeyService.delete({
        userId: user.id,
        type: KeyTypes.DeleteAccount,
      });

      const otp = Otp.generate();
      const userKey = await UserKeyService.create(
        {
          userId: user.id,
          type: KeyTypes.DeleteAccount,
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000), // 1h
        },
        {
          transaction,
        }
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;

      await EmailService.sendDeleteAccountEmail({
        to: user.email,
        name: user.name,
        otp,
        confirmUrl,
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({
        key: userKey,
        confirmUrl,
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

      const key = await UserKeyService.findOneBy({
        id: request.params.id,
        type: KeyTypes.DeleteAccount,
      });

      if (!key) throw new NotFoundError("Chave de acesso não encontrada");

      if (!Bcrypt.compare(body.otp, key.otp) || (key.expiresAt && new Date() > new Date(key.expiresAt)))
        throw new TeapotError("Código incorreto ou expirado");

      const removedUser = await UserService.remove(key.user!, {
        transaction,
      });

      await UserKeyService.remove(key, { transaction });

      await stripe.customers.del(removedUser.stripeId!);

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({ user: removedUser });
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

      const key = await UserKeyService.findOneBy({
        id: request.params.id,
        type: KeyTypes.DeleteAccount,
      });

      if (!key) throw new NotFoundError("Chave de acesso não encontrada");

      const otp = Otp.generate();

      const userKey = await UserKeyService.update(
        key,
        {
          otp: Bcrypt.hash(otp),
          expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000), // 1h
        },
        {
          transaction,
        }
      );

      const confirmUrl = `${body.confirmUrl}?key=${userKey.id}`;

      await EmailService.sendDeleteAccountEmail({
        to: key.user!.email,
        name: key.user!.name,
        otp,
        confirmUrl,
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({
        key: userKey,
        confirmUrl,
      });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }
}
