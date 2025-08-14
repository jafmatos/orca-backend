import { NextFunction, Request, Response } from "express";

export const pagination = ({ defaultPage = 1, defaultPerPage = 10 }) => {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      const rawPage = request.query.page?.toString();
      const rawPerPage = request.query.perPage?.toString();
      const page = Math.abs(Math.floor(rawPage ? parseInt(rawPage) || defaultPage : defaultPage));
      const perPage = Math.abs(Math.floor(rawPerPage ? parseInt(rawPerPage) || defaultPerPage : defaultPerPage));

      request.pagination = {
        page: page,
        perPage: perPage,
        toQuery: () => {
          return {
            skip: perPage * (page - 1),
            take: perPage,
          };
        },
        toResponse: () => {
          return {
            page,
            perPage,
          };
        },
      };

      return next();
    } catch (error) {
      console.log(error);
      return response.status(500).json(error);
    }
  };
};
