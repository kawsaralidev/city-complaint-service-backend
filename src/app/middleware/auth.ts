import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { HttpStatus } from "../../constants/httpStatus";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";
import { Role } from "../../../generated/prisma/enums";

export interface RequestUser {
  email: string;
  name: string;
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      // Get access token from Authorization header
      const token = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

      // Throw an error if access token is missing
      if (!token) {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          "You are not logged in. Please log in to access this resource.",
        );
      }

      // Verify the access token
      const verifiedToken = jwtUtils.verifyToken(
        token,
        config.jwt_access_secret,
      );

      // Throw an error if access token is invalid or expired
      if (!verifiedToken.success) {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          "Invalid or expired access token.",
        );
      }

      // Get user information from verified token
      const { userId, role } = verifiedToken.data as JwtPayload & {
        email: string;
        name: string;
        userId: string;
        role: Role;
      };

      // Check if user has the required role
      if (requiredRoles.length && !requiredRoles.includes(role)) {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          "You don't have permission to access this resource.",
        );
      }

      // Verify that the user still exists in the database
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      // Throw an error if user does not exist
      if (!user) {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          "User not found. Please log in again.",
        );
      }

      // Check if user account is deleted
      if (user.deletedAt) {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          "Your account is no longer available.",
        );
      }

      // Check if user account is blocked
      if (user.status === "BLOCKED") {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          "Your account has been blocked. Please contact support.",
        );
      }

      // Verify the user's current role from database
      if (user.role !== role) {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          "Your account permissions have changed. Please log in again.",
        );
      }

      // Store authenticated database user information in request
      req.user = {
        email: user.email,
        name: user.name,
        userId: user.id,
        role: user.role,
      };

      next();
    },
  );
};
