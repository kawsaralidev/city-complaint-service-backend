import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getAllUsersQuerySchema,
  updateProfileValidationSchema,
  updateUserStatusSchema,
} from "./user.validation";
import { userController } from "./user.controller";
import { upload } from "../../lib/multer";
import { changePasswordSchema } from "../auth/auth.validation";

const router = Router();

router.get(
  "/",
  auth(Role.ADMIN),
  validateRequest(getAllUsersQuerySchema),
  userController.getAllUsers,
);

router.patch(
  "/me",
  auth(),
  upload.single("image"),
  validateRequest(updateProfileValidationSchema),
  userController.updateMyProfile,
);

router.patch(
  "/change-password",
  auth(),
  validateRequest(changePasswordSchema),
  userController.changePassword,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateUserStatusSchema),
  userController.updateUserStatus,
);

router.patch("/:id/role", auth(Role.ADMIN), userController.updateUserRole);

export const userRoutes = router;
