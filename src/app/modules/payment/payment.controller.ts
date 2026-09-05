import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { HttpStatus } from "../../../constants/httpStatus";

const createPayment = async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const payment = await paymentService.createPayment(citizenId, req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Payment session created successfully.",
    data: payment,
  });
};

// Handle Stripe webhook
const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    throw new Error("Stripe signature is missing.");
  }

  await paymentService.handleStripeWebhook(signature, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Webhook processed successfully.",
    data: null,
  });
};

const getMyPayments = async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const payments = await paymentService.getMyPayments(citizenId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Payments retrieved successfully.",
    data: payments,
  });
};

export const paymentController = {
  createPayment,
  handleStripeWebhook,
  getMyPayments,
};
