import { ApiError } from "./ApiError";

export class BadRequestError extends ApiError {
  /**
   *
   */
  constructor(message: string, reason?: string) {
    super(400, message, reason);
  }
}
