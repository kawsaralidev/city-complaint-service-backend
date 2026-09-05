import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createPaymentSchema } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();

router.post(
  "/create",
  auth(Role.CITIZEN),
  validateRequest(createPaymentSchema),
  paymentController.createPayment,
);

router.post("/webhook", paymentController.handleStripeWebhook);

router.get("/my-payments", auth(Role.CITIZEN), paymentController.getMyPayments);

export const paymentRoutes = router;
