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

// Login User
const login = async (req: Request, res: Response) => {
  // Get login credentials from request body
  const result = await authService.login(req.body);

  // Store refresh token in an HttpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Send access token and user information in response
  res.status(HttpStatus.OK).json({
    success: true,
    message: "Login successful.",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
};

// Refresh Access Token
const refreshAccessToken = async (req: Request, res: Response) => {
  // Get refresh token from HttpOnly cookie
  const { refreshToken } = req.cookies;

  // Generate a new access token
  const result = await authService.refreshAccessToken(refreshToken);

  // Send the new access token
  res.status(HttpStatus.OK).json({
    success: true,
    message: "Access token refreshed successfully.",
    data: {
      accessToken: result.accessToken,
    },
  });
};

export const authController = {
  register,
  verifyRegisterEmail,
  login,
  refreshAccessToken,
};
