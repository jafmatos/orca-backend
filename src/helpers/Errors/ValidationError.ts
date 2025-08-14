import { ZodError } from "zod";
import { ApiError } from "./ApiError";

export class ValidationError extends ApiError {
  public static fromZod(ze: ZodError) {
    return ze.issues.map((issue) => {
      return {
        message: issue.message,
        path: issue.path[0],
        input: issue.input,
      };
    });
  }

  /**
   *
   */
  constructor(message: string, errors: { message: string; path: PropertyKey; input: any }[]) {
    super(422, message, errors);
  }
}
