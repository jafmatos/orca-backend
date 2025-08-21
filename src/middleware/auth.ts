import { NextFunction, Request, Response } from "express";
import { UserRoles } from "Src/database/entities/User.entity";
import { ForbiddenError, UnauthorizedAccessError } from "Src/helpers/Errors";
import { Jwt } from "Src/helpers/Jwt";
import { UserService } from "Src/services/UserService";

export const auth = (roles?: UserRoles[]) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const authorization = request.headers.authorization;
      const token = authorization?.split(" ")[1];

      if (!token) throw new UnauthorizedAccessError();

      const jwtData = Jwt.verify(token);

      const user = await UserService.findOneBy({
        id: jwtData.id,
        role: jwtData.role,
      });

      if (!user) throw new UnauthorizedAccessError();

      if (roles && !roles.includes(user.role)) throw new ForbiddenError("Você não tem permissão para acessar este recurso");

      request.auth = {
        user,
      };

      next();
    } catch (error) {
      throw new UnauthorizedAccessError();
    }
  };
};
