import { Router } from "express";
import { UserController } from "Src/controllers/admin/UserController";
import { UserRoles } from "Src/database/entities/User.entity";
import { auth } from "Src/middleware/auth";
import { pagination } from "Src/middleware/pagination";

export const adminRouter = Router();

adminRouter.get("/users", auth([UserRoles.SuperUser]), pagination({ defaultPage: 1, defaultPerPage: 10 }), UserController.index);
