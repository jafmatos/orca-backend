import { ApiError } from "./ApiError";

export class InternalServerError extends ApiError {
  /**
   *
   */
  constructor(message: string = "Erro interno do servidor") {
    super(500, message);
  }
}
