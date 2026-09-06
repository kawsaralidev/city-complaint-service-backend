import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getAllUsersQuerySchema,
  updateUserStatusSchema,
} from "./user.validation";
import { userController } from "./user.controller";

const router = Router();

router.get(
  "/",
  auth(Role.ADMIN),
  validateRequest(getAllUsersQuerySchema),
  userController.getAllUsers,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateUserStatusSchema),
  userController.updateUserStatus,
);

export const userRoutes = router;
