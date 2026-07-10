import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CursorPaginationOptions {
  paginated?: boolean;
  cursor?: Record<string, any>;
  take: number;
}

export const CursorPagination = createParamDecorator(
  (
    data: { defaultTake?: number } | undefined,
    ctx: ExecutionContext,
  ): CursorPaginationOptions => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const defaultTake = data?.defaultTake || 10;

    const take =
      typeof request.query.take === 'string' && !isNaN(+request.query.take)
        ? parseInt(request.query.take)
        : defaultTake;

    const result: CursorPaginationOptions = {
      paginated: request.query.paginated === 'false' ? false : true,
      cursor: undefined,
      take,
    };

    if (typeof request.query.cursor === 'string') {
      try {
        const decoded = Buffer.from(request.query.cursor, 'base64').toString(
          'utf-8',
        );
        const parsed = JSON.parse(decoded);

        if (Object.keys(parsed).every((key) => !!parsed[key])) {
          result.cursor = parsed;
        }
      } catch (e) {}
    }

    return result;
  },
);
