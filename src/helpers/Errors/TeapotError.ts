import { ApiError } from "./ApiError";

export class TeapotError extends ApiError {
  /**
   *
   */
  constructor(message: string = "I'm a teapot") {
    super(418, message);
  }
}
