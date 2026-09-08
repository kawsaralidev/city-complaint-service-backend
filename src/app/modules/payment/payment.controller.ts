import type { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { HttpStatus } from "../../../constants/httpStatus";
import { sendResponse } from "../../utils/sendResponse";

const createPayment = async (req: Request, res: Response) => {
	const citizenId = req.user?.userId;

	if (!citizenId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const payment = await paymentService.createPayment(citizenId, req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Payment session created successfully.",
		data: payment,
	});
};

// Handle Stripe webhook
const handleStripeWebhook = async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (!signature || Array.isArray(signature)) {
		throw new AppError(HttpStatus.BAD_REQUEST, "Stripe signature is missing.");
	}

	await paymentService.handleStripeWebhook(signature, req.body);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Webhook processed successfully.",
		data: null,
	});
};

const getAllPayments = async (_req: Request, res: Response) => {
	const payments = await paymentService.getAllPayments();

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Payments retrieved successfully.",
		data: payments,
	});
};

const getMyPayments = async (req: Request, res: Response) => {
	const citizenId = req.user?.userId;

	if (!citizenId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const payments = await paymentService.getMyPayments(citizenId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Payments retrieved successfully.",
		data: payments,
	});
};

export const paymentController = {
	createPayment,
	handleStripeWebhook,
	getAllPayments,
	getMyPayments,
};
