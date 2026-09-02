import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

const app = express();

app.use(express.json());

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
