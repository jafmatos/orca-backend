import { User } from "Src/database/entities/User.entity";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: User;
      };
      pagination?: {
        page: number;
        perPage: number;
        toQuery: () => { skip: number; take: number };
        toResponse: () => { page: number; perPage: number };
      };
    }
  }
}
