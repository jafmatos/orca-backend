import { ApiError } from "./ApiError";

export class ForbiddenError extends ApiError {
  /**
   *
   */
  constructor(message: string = "Você não tem acesso a este recurso") {
    super(403, message);
  }
}
