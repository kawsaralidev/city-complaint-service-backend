import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { authRoutes } from "./app/modules/auth/auth.route";
import cookieParser from "cookie-parser";
import passport from "./app/config/passport";

const app = express();
app.use(express.json());
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// routes
app.use("/api/v1/auth", authRoutes);

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
