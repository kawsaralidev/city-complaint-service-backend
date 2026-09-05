import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createPaymentSchema } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();

// Create payment
router.post(
  "/create",
  auth(Role.CITIZEN),
  validateRequest(createPaymentSchema),
  paymentController.createPayment,
);

// Stripe webhook
router.post("/webhook", paymentController.handleStripeWebhook);

export const paymentRoutes = router;
