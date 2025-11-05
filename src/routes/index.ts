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
import { OverviewController } from "Src/controllers/OverviewController";
import { PlanController } from "Src/controllers/PlanController";
import { StripeWebhookController } from "Src/controllers/stripe/WebhookController";
import { StripeCheckoutController } from "../controllers/stripe/CheckoutController";
import { StripeBillingPortalsController } from "Src/controllers/stripe/BillingPortalsController";
import { UserRoles } from "Src/database/entities/User.entity";
import { DeleteAccountController } from "Src/controllers/users/DeleteAccountController";
import { subscribed } from "Src/middleware/subscribed";
import { ReminderController } from "Src/controllers/ReminderController";
import { PushSubscriptionController } from "Src/controllers/PushSubscriptionController";

export const router = Router({ strict: true });
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/uploads/:fileName", UploadsController.show);

router.post("/stripe/webhook", StripeWebhookController.store);
router.post("/stripe/checkout", auth(), StripeCheckoutController.store);
router.post("/stripe/checkout/verify", auth(), StripeCheckoutController.update);
router.post("/stripe/billing-portals", auth(), StripeBillingPortalsController.store);

router.get("/plans", PlanController.index);
router.post("/plans", auth([UserRoles.SuperUser]), PlanController.store);
router.put("/plans/:id", auth([UserRoles.SuperUser]), PlanController.update);
router.delete("/plans/:id", auth([UserRoles.SuperUser]), PlanController.destroy);

router.post("/sign-in", SignInController.store);
router.get("/sign-in", auth([UserRoles.User]), SignInController.show);

router.post("/sign-up", SignUpController.store);
router.put("/sign-up/:id", SignUpController.update);
router.put("/sign-up/resend/:id", SignUpController.resend);

router.post("/reset-password", ResetPasswordController.store);
router.put("/reset-password/:id", ResetPasswordController.update);
router.put("/reset-password/resend/:id", ResetPasswordController.resend);

router.post("/delete-account", auth(), DeleteAccountController.store);
router.put("/delete-account/:id", auth(), DeleteAccountController.update);
router.put("/delete-account/resend/:id", auth(), DeleteAccountController.resend);

router.get("/users/overview", auth(), subscribed, OverviewController.show);

router.put("/users", auth(), subscribed, UserController.update);

router.put("/users/avatar", auth(), subscribed, upload.single("avatar"), AvatarController.update);
router.delete("/users/avatar", auth(), subscribed, AvatarController.destroy);

router.get("/categories", auth(), subscribed, CategoryController.index);
router.get("/categories/:id", auth(), subscribed, CategoryController.show);
router.post("/categories", auth(), subscribed, CategoryController.store);
router.put("/categories/:id", auth(), subscribed, CategoryController.update);
router.delete("/categories/:id", auth(), subscribed, CategoryController.destroy);
router.put("/categories/recover/:id", auth(), subscribed, CategoryController.recover);

router.get("/entries", auth(), subscribed, pagination({ defaultPage: 1, defaultPerPage: 10 }), EntryController.index);
router.get("/entries/:id", auth(), subscribed, EntryController.show);
router.post("/entries", auth(), subscribed, EntryController.store);
router.put("/entries/:id", auth(), subscribed, EntryController.update);
router.delete("/entries/:id", auth(), subscribed, EntryController.destroy);

router.get("/reminders", auth(), subscribed, pagination({ defaultPage: 1, defaultPerPage: 10 }), ReminderController.index);
router.get("/reminders/:id", auth(), subscribed, ReminderController.show);
router.post("/reminders", auth(), subscribed, ReminderController.store);
router.put("/reminders/:id", auth(), subscribed, ReminderController.update);
router.delete("/reminders/:id", auth(), subscribed, ReminderController.destroy);

router.post("/webpush/subscriptions", auth(), subscribed, PushSubscriptionController.store);

router.get("/", async (request, response) => {
  return response.send("Hello, World!");
});
