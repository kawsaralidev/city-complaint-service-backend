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

export const paymentController = {
  createPayment,
};
