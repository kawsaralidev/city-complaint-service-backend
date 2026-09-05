import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
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

const app = express();

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/service-requests", serviceRequestRoutes);
app.use("/api/v1/payments", paymentRoutes);

// 404
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "City Complaint & Service Platform API is running",
    data: null,
  });
});

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      message: "Welcome to City Complaint and Service Backend",
      data: null,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default app;
