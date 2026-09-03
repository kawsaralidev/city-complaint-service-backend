import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

import { HttpStatus } from "../../constants/httpStatus.js";
import config from "../config/index.js";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if (config.node_env === "development") {
    console.log("Error from Global Error Handler:", err);
  }

  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let errors: unknown[] = [];

  // AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Zod Error
  else if (err instanceof ZodError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Validation failed";

    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Normal Error
  else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message:
      config.node_env === "development"
        ? message
        : statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
          ? "Internal Server Error"
          : message,
    errors,
  });
};
