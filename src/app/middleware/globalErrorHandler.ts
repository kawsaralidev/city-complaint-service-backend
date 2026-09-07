import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/AppError";
import { HttpStatus } from "../../constants/httpStatus";
import config from "../config/index";

export const globalErrorHandler: ErrorRequestHandler = (
	err,
	_req,
	res,
	_next,
) => {
	if (config.node_env === "development") {
		console.error("Error from Global Error Handler:", err);
	}

	let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
	let message = "Internal Server Error";
	let errors: unknown[] = [];

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
	} else if (err instanceof ZodError) {
		statusCode = HttpStatus.BAD_REQUEST;
		message = "Validation failed";
		errors = err.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = HttpStatus.CONFLICT;
			message = "A record with the same unique value already exists.";
		} else if (err.code === "P2025") {
			statusCode = HttpStatus.NOT_FOUND;
			message = "The requested record was not found.";
		} else {
			statusCode = HttpStatus.BAD_REQUEST;
			message = "Database operation failed.";
		}
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = HttpStatus.BAD_REQUEST;
		message = "Invalid database request.";
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		statusCode = HttpStatus.SERVICE_UNAVAILABLE;
		message = "Database service is temporarily unavailable.";
	} else if (
		err instanceof Error &&
		err.name === "StripeSignatureVerificationError"
	) {
		statusCode = HttpStatus.BAD_REQUEST;
		message = "Invalid Stripe webhook signature.";
	} else if (
		err &&
		typeof err === "object" &&
		"code" in err &&
		err.code === "LIMIT_FILE_SIZE"
	) {
		statusCode = HttpStatus.BAD_REQUEST;
		message = "File size exceeds the maximum allowed limit.";
	} else if (err instanceof SyntaxError && "body" in err) {
		statusCode = HttpStatus.BAD_REQUEST;
		message = "Invalid JSON payload.";
	} else if (err instanceof Error) {
		// Keep unexpected errors generic in production.
		if (config.node_env === "development") {
			message = err.message;
		}
	}

	res.status(statusCode).json({
		success: false,
		message,
		errors,
	});
};
