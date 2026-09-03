import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

const app = express();

// routes
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// etc.

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
