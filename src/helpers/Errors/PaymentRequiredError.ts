import { ApiError } from "./ApiError";

export class PaymentRequiredError extends ApiError {
  /**
   *
   */
  constructor(message: string) {
    super(402, message);
  }
}
