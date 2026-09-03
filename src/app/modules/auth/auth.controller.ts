import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { HttpStatus } from "../../../constants/httpStatus.js";
import { AppError } from "../../utils/AppError.js";

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

// Get Current User
const getCurrentUser = async (req: Request, res: Response) => {
  // Get authenticated user ID from request
  const userId = req.user?.userId;

  // Throw an error if authenticated user information is missing
  if (!userId) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Authentication required.");
  }

  // Get current user information
  const result = await authService.getCurrentUser(userId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "User profile retrieved successfully.",
    data: result,
  });
};

// Logout User
const logout = async (_req: Request, res: Response) => {
  // Clear refresh token from HttpOnly cookie
  res.clearCookie("refreshToken");
  res.status(HttpStatus.OK).json({
    success: true,
    message: "Logout successful.",
    data: null,
  });
};

export const authController = {
  register,
  verifyRegisterEmail,
  login,
  refreshAccessToken,
  getCurrentUser,
  logout,
};
