import "dotenv/config";
import express, { type Request, type Response } from "express";
import { sendResponse } from "./app/utils/sendResponse";
import cors from "cors";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { authRoutes } from "./app/modules/auth/auth.route";
import cookieParser from "cookie-parser";
import passport from "./app/config/passport";
import { categoryRoutes } from "./app/modules/category/category.route";
import { complaintRoutes } from "./app/modules/complaint/complaint.route";
import { serviceRoutes } from "./app/modules/service/service.routes";
import { serviceRequestRoutes } from "./app/modules/serviceRequest/service-request.route";
import config from "./app/config";
import { paymentRoutes } from "./app/modules/payment/payment.route";
import helmet from "helmet";
import { generalRateLimiter } from "./app/middleware/rateLimit";
import { auditLogRoutes } from "./app/modules/auditLog/audit-log.route";
import { userRoutes } from "./app/modules/user/user.routes";
import { dashboardRoutes } from "./app/modules/dashboard/dashboard.routes";
import { catchAsync } from "./app/utils/catchAsync";

const app = express();

app.set("trust proxy", 1);

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(helmet());
app.use(generalRateLimiter);
app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/service-requests", serviceRequestRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Basic route
app.get(
  "/",
  catchAsync(async (_req: Request, res: Response) => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "City Complaint & Service Platform API is running",
      data: null,
    });
  }),
);

app.get(
  "/test",
  catchAsync(async (_req: Request, res: Response) => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Welcome to City Complaint and Service Backend",
      data: null,
    });
  }),
);

// 404
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
