import { Router } from "express";
import { CategoryController } from "Src/controllers/CategoryController";
import { EntryController } from "Src/controllers/EntryController";
import { pagination } from "Src/middleware/pagination";

export const router = Router({ strict: true });

router.get("/categories", CategoryController.index);
router.get("/categories/:id", CategoryController.show);
router.post("/categories", CategoryController.store);
router.put("/categories/:id", CategoryController.update);
router.delete("/categories/:id", CategoryController.destroy);
router.put("/categories/recover/:id", CategoryController.recover);

router.get("/entries", pagination({ defaultPage: 1, defaultPerPage: 10 }), EntryController.index);
router.get("/entries/sumup/", pagination({ defaultPage: 1, defaultPerPage: 10 }), EntryController.sumUp);
router.get("/entries/:id", EntryController.show);
router.post("/entries", EntryController.store);
router.put("/entries/:id", EntryController.update);
router.delete("/entries/:id", EntryController.destroy);

router.get("/", async (request, response) => {
  return response.send("Hello, I'm Orça!");
});
