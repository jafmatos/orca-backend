export class ApiError extends Error {
  public readonly reason?: string;
  public readonly statusCode: number = 500;
  public readonly errors: any[] = [];

  /**
   *
   */
  constructor(statusCode: number, message: string, reason?: string, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    reason && (this.reason = reason);
    errors && (this.errors = errors);
  }
}
