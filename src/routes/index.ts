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
import { ResetPasswordController } from "Src/controllers/users/ResetPasswordController";
import { OverviewController } from "Src/controllers/users/OverviewController";
import { PlanController } from "Src/controllers/PlanController";
import { StripeWebhookController } from "Src/controllers/stripe/WebhookController";
import { StripeCheckoutController } from "../controllers/stripe/CheckoutController";
import { StripeBillingPortalsController } from "Src/controllers/stripe/BillingPortalsController";
import { UserRoles } from "Src/database/entities/User.entity";

export const router = Router({ strict: true });
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
const subscribedUserMiddleware = auth([UserRoles.User], { withValidSubscription: true });

router.get("/uploads/:fileName", UploadsController.show);

router.post("/stripe/webhook", StripeWebhookController.store);
router.post("/stripe/checkout", auth(), StripeCheckoutController.store);
router.post("/stripe/billing-portals", auth(), StripeBillingPortalsController.store);

router.post("/sign-up", SignUpController.store);
router.put("/sign-up/:id", SignUpController.update);
router.put("/sign-up/resend/:id", SignUpController.resend);

router.post("/sign-in", SignInController.store);
router.get("/sign-in", auth([UserRoles.User]), SignInController.show);

router.post("/reset-password", ResetPasswordController.store);
router.put("/reset-password/:id", ResetPasswordController.update);

router.get("/plans", PlanController.index);

router.get("/users/overview", subscribedUserMiddleware, OverviewController.show);

router.put("/users", subscribedUserMiddleware, UserController.update);

router.put("/users/avatar", subscribedUserMiddleware, upload.single("avatar"), AvatarController.update);
router.delete("/users/avatar", subscribedUserMiddleware, AvatarController.destroy);

router.get("/categories", subscribedUserMiddleware, CategoryController.index);
router.get("/categories/:id", subscribedUserMiddleware, CategoryController.show);
router.post("/categories", subscribedUserMiddleware, CategoryController.store);
router.put("/categories/:id", subscribedUserMiddleware, CategoryController.update);
router.delete("/categories/:id", subscribedUserMiddleware, CategoryController.destroy);
router.put("/categories/recover/:id", subscribedUserMiddleware, CategoryController.recover);

router.get("/entries", subscribedUserMiddleware, pagination({ defaultPage: 1, defaultPerPage: 10 }), EntryController.index);
router.get("/entries/:id", subscribedUserMiddleware, EntryController.show);
router.post("/entries", subscribedUserMiddleware, EntryController.store);
router.put("/entries/:id", subscribedUserMiddleware, EntryController.update);
router.delete("/entries/:id", subscribedUserMiddleware, EntryController.destroy);

router.get("/", async (request, response) => {
  return response.send("Hello, I'm running on Docker!");
});
