import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

import { HttpStatus } from "../../constants/httpStatus.js";
import config from "../config/index.js";
import { Prisma } from "../../../generated/prisma/client.js";
import multer from "multer";

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
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = HttpStatus.CONFLICT;
      message = "A record with this value already exists.";
    } else if (err.code === "P2025") {
      statusCode = HttpStatus.NOT_FOUND;
      message = "The requested record was not found.";
    } else {
      statusCode = HttpStatus.BAD_REQUEST;
      message = "Database operation failed.";
    }
  } else if (err instanceof multer.MulterError) {
    statusCode = HttpStatus.BAD_REQUEST;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size must not exceed 1 MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files were uploaded.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file was uploaded.";
    } else {
      message = "File upload failed.";
    }
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
