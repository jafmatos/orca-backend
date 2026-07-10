import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  perPage: number;
  paginated: boolean;
  toQuery: () => { skip?: number; take?: number };
  toResponse: () => { page: number; perPage?: number };
}

export const Pagination = createParamDecorator(
  (
    data: { defaultPage?: number; defaultPerPage?: number } | undefined,
    ctx: ExecutionContext,
  ): PaginationOptions => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const defaultPage = data?.defaultPage || 1;
    const defaultPerPage = data?.defaultPerPage || 10;

    const rawPage = request.query.page?.toString();
    const rawPerPage = request.query.perPage?.toString();
    const paginated = request.query.paginated === 'false';
    const page = Math.abs(
      Math.floor(rawPage ? parseInt(rawPage) || defaultPage : defaultPage),
    );
    const perPage = Math.abs(
      Math.floor(
        rawPerPage ? parseInt(rawPerPage) || defaultPerPage : defaultPerPage,
      ),
    );

    return {
      page,
      perPage,
      paginated,
      toQuery: () => {
        if (paginated) {
          return { skip: undefined, take: undefined };
        }
        return {
          skip: perPage * (page - 1),
          take: perPage,
        };
      },
      toResponse: () => {
        if (paginated) {
          return { page: 1, perPage: undefined };
        }
        return { page, perPage };
      },
    };
  },
);
