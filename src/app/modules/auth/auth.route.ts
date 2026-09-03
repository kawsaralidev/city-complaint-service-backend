import { Router } from "express";

import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  loginSchema,
  registerSchema,
  verifyRegistrationSchema,
} from "./auth.validation";
import { auth } from "../../middleware/auth";

import passport from "../../config/passport";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);

router.post(
  "/verify-register-email",
  validateRequest(verifyRegistrationSchema),
  authController.verifyRegisterEmail,
);

router.post("/login", validateRequest(loginSchema), authController.login);

router.post("/refresh-token", authController.refreshAccessToken);

router.get("/me", auth(), authController.getCurrentUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  authController.googleLogin,
);

router.post("/logout", authController.logout);

export const authRoutes = router;
