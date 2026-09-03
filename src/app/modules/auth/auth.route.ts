import { Router } from "express";

import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  loginSchema,
  registerSchema,
  verifyRegistrationSchema,
} from "./auth.validation";

const router = Router();

// Register User
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);

// Verify Registration Email
router.post(
  "/verify-register-email",
  validateRequest(verifyRegistrationSchema),
  authController.verifyRegisterEmail,
);

// Login User
router.post("/login", validateRequest(loginSchema), authController.login);

// Refresh Access Token
// router.post("/refresh-token", authController.refreshAccessToken);

export const authRoutes = router;
