import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { HttpStatus } from "../../../constants/httpStatus.js";
import { AppError } from "../../utils/AppError.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { jwtUtils } from "../../utils/jwt.js";
import config from "../../config/index.js";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync.js";

// Register User
const register = async (req: Request, res: Response) => {
  // Get registration data from request body
  const result = await authService.register(req.body);

  // Send registration response
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: result.message,
    data: {
      email: result.email,
    },
  });
};

// Verify Registration Email
const verifyRegisterEmail = async (req: Request, res: Response) => {
  const result = await authService.verifyRegisterEmail(req.body);

  // Set access token in HttpOnly cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Set refresh token in HttpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: result.message,
    data: result.user,
  });
};

const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  // Set access token in HttpOnly cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Set refresh token in HttpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Login successful.",
    data: {
      user: result.user,
    },
  });
};

const demoLogin = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;

  const result = await authService.demoLogin(role);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "lax",
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Demo login successful.",
    data: {
      user: result.user,
    },
  });
});

// Google Login

const googleLogin = async (req: Request, res: Response) => {
  // Get authenticated Google user
  const user = req.user as
    | {
        id: string;
      }
    | undefined;

  // Throw an error if Google user is missing
  if (!user?.id) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Google authentication failed.",
    );
  }

  // Generate authentication tokens
  const result = await authService.googleLogin(user.id);

  // Store access token in an HttpOnly cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Store refresh token in an HttpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Redirect user to frontend home page
  res.redirect(`${process.env.FRONTEND_URL}/`);
};

// Refresh Access Token
const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await authService.refreshAccessToken(refreshToken);

  // Update access token in HttpOnly cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Access token refreshed successfully.",
    data: null,
  });
};

// Get Current User
const getCurrentUser = async (req: Request, res: Response) => {
  // Get authenticated user ID from request
  let userId = req.user?.userId;

  // Refresh access token if the current access token is missing or expired
  if (!userId) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: "No authenticated user.",
        data: null,
      });
    }

    try {
      const result = await authService.refreshAccessToken(refreshToken);

      // Set new access token in HttpOnly cookie
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Verify the new access token
      const verifiedToken = jwtUtils.verifyToken(
        result.accessToken,
        config.jwt_access_secret,
      );

      if (!verifiedToken.success) {
        return sendResponse(res, {
          statusCode: HttpStatus.OK,
          success: true,
          message: "No authenticated user.",
          data: null,
        });
      }

      const payload = verifiedToken.data as JwtPayload & {
        userId: string;
      };

      userId = payload.userId;
    } catch {
      return sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: "No authenticated user.",
        data: null,
      });
    }
  }

  // Get current user information
  const result = await authService.getCurrentUser(userId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User profile retrieved successfully.",
    data: result,
  });
};

// Logout User
const logout = async (_req: Request, res: Response) => {
  // Clear refresh token from HttpOnly cookie
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Logout successful.",
    data: null,
  });
};

export const authController = {
  register,
  verifyRegisterEmail,
  login,
  demoLogin,
  googleLogin,
  refreshAccessToken,
  getCurrentUser,
  logout,
};
