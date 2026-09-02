import "dotenv/config";
import express, { Request, Response } from "express";

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

export default app;
