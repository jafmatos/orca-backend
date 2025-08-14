import { Router } from "express";
import { CategoryController } from "Src/controllers/CategoryController";
import { ExpenseController } from "Src/controllers/ExpenseController";
import { pagination } from "Src/middleware/pagination";

export const router = Router({ strict: true });

router.get("/categories", CategoryController.index);
router.get("/categories/:id", CategoryController.show);
router.post("/categories", CategoryController.store);
router.put("/categories/:id", CategoryController.update);
router.delete("/categories/:id", CategoryController.destroy);
router.put("/categories/recover/:id", CategoryController.recover);

router.get("/expenses", pagination({ defaultPage: 1, defaultPerPage: 10 }), ExpenseController.index);
router.get("/expenses/sumup/", pagination({ defaultPage: 1, defaultPerPage: 10 }), ExpenseController.sumUp);
router.get("/expenses/:id", ExpenseController.show);
router.post("/expenses", ExpenseController.store);
router.put("/expenses/:id", ExpenseController.update);
router.delete("/expenses/:id", ExpenseController.destroy);

router.get("/", async (request, response) => {
  return response.send("Hello, I'm Orça!");
});
