import { NextFunction, Request, Response } from "express";
import { ApiError } from "Src/helpers/Errors";

export const express_async_errors_middleware = (error: Error & ApiError, request: Request, response: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") console.log(error);

  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? "Erro interno do servidor";

  if (response.headersSent) return next(error);

  return response.status(statusCode).json({
    ...error,
    message,
  });
};
