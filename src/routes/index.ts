import { Router } from "express";
import { CategoryController } from "Src/controllers/CategoryController";
import { EntryController } from "Src/controllers/EntryController";
import { SignInController } from "Src/controllers/users/SignInController";
import { SignUpController } from "Src/controllers/users/SignUpController";
import { UserController } from "Src/controllers/users/MainController";
import { auth } from "Src/middleware/auth";
import { pagination } from "Src/middleware/pagination";
import multer from "multer";
import { AvatarController } from "Src/controllers/users/AvatarController";
import { UploadsController } from "Src/controllers/UploadsController";

export const router = Router({ strict: true });
const upload = multer();

router.get("/uploads/:fileName", UploadsController.show);

router.post("/sign-up", SignUpController.store);

router.post("/sign-in", SignInController.store);
router.get("/sign-in", auth(), SignInController.show);

router.put("/users/avatar", auth(), upload.single("avatar"), AvatarController.update);
router.delete("/users/avatar", auth(), AvatarController.destroy);

router.get("/categories", auth(), CategoryController.index);
router.get("/categories/:id", auth(), CategoryController.show);
router.post("/categories", auth(), CategoryController.store);
router.put("/categories/:id", auth(), CategoryController.update);
router.delete("/categories/:id", auth(), CategoryController.destroy);
router.put("/categories/recover/:id", auth(), CategoryController.recover);

router.get("/entries", auth(), pagination({ defaultPage: 1, defaultPerPage: 10 }), EntryController.index);
router.get("/entries/sumup/", auth(), EntryController.sumUp);
router.get("/entries/:id", auth(), EntryController.show);
router.post("/entries", auth(), EntryController.store);
router.put("/entries/:id", auth(), EntryController.update);
router.delete("/entries/:id", auth(), EntryController.destroy);

router.get("/", async (request, response) => {
  return response.send("Hello, I'm Orça!");
});
