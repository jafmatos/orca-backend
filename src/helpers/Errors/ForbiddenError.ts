import { ApiError } from "./ApiError";
import { ErrorReason } from "./ErrorReason";

export class ForbiddenError {
  private readonly statusCode = 403;
  private message: string = "Você não tem acesso a este recurso";
  private reason?: ErrorReason;
  private errors?: any[];

  setMessage(message: string) {
    this.message = message;

    return this;
  }

  setReason(reason: ErrorReason) {
    this.reason = reason;

    return this;
  }

  setErrors(errors: any[]) {
    this.errors = errors;

    return this;
  }

  throw() {
    throw new ApiError(this.statusCode, this.message, this.reason, this.errors);
  }
}
