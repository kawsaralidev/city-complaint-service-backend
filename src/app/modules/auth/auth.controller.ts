import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { HttpStatus } from "../../../constants/httpStatus.js";

// Register User
const register = async (req: Request, res: Response) => {
  // Get registration data from request body
  const result = await authService.register(req.body);

  // Send registration response
  res.status(HttpStatus.OK).json({
    success: true,
    message: result.message,
    data: {
      email: result.email,
    },
  });
};

// Verify Registration Email
const verifyRegisterEmail = async (req: Request, res: Response) => {
  // Get email and OTP from request body
  const result = await authService.verifyRegisterEmail(req.body);

  // Send email verification response
  res.status(HttpStatus.OK).json({
    success: true,
    message: result.message,
    data: result.user,
  });
};

export const authController = {
  register,
  verifyRegisterEmail,
};
