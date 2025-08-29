import { Request, Response } from "express";
import { TypeormTransaction } from "Src/database/TypeormTransaction";
import { BadRequestError, UnauthorizedAccessError } from "Src/helpers/Errors";
import { Jetpack } from "Src/helpers/Jetpack";
import { AvatarService } from "Src/services/AvatarService";
import { v4 } from "uuid";

export class AvatarController {
  public static async update(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const file = request.file;
      const user = request.auth!.user;

      if (!user) throw new UnauthorizedAccessError();
      if (!file) throw new BadRequestError("É necessário enviar uma imagem");

      const [type, extname] = file.mimetype.split("/");

      if (type !== "image") throw new BadRequestError("É necessário enviar uma imagem");

      if (user.avatar) {
        await AvatarService.remove(user.avatar, { transaction });
        await Jetpack.removeFile(user.avatar.fileName);
      }

      const fileName = `${v4()}.${extname}`;

      user.avatar = await AvatarService.create(
        {
          fileName,
          user,
        },
        {
          transaction,
        }
      );

      await Jetpack.upload({
        data: file.buffer,
        fileName,
      });

      await transaction.commit();
      await transaction.release();

      return response.status(200).json({ user });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }

  public static async destroy(request: Request, response: Response) {
    const transaction = new TypeormTransaction();

    await transaction.begin();

    try {
      const user = request.auth!.user;

      if (!user) throw new UnauthorizedAccessError();

      if (!user.avatar) return response.status(200).end();

      await AvatarService.remove(user.avatar, { transaction });
      await Jetpack.removeFile(user.avatar.fileName);

      await transaction.commit();
      await transaction.release();

      user.avatar = undefined;

      return response.status(200).json({ user });
    } catch (error) {
      await transaction.rollback();
      await transaction.release();

      throw error;
    }
  }
}
