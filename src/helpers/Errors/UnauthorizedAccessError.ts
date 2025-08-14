import { ApiError } from "./ApiError";

export class UnauthorizedAccessError extends ApiError {
  /**
   *
   */
  constructor(message: string = "Acesso não autorizado") {
    super(401, message);
  }
}
