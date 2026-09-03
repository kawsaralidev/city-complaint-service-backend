import { Router } from "express";

import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { registerSchema, verifyRegistrationSchema } from "./auth.validation";

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

export const authRoutes = router;
