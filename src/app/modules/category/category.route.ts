import { Router } from "express";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { categoryController } from "./category.controller";
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from "./ategory.validation";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

router.get("/", auth(), categoryController.getAllCategories);

router.get("/:id", auth(), categoryController.getCategoryById);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateCategoryStatusSchema),
  categoryController.updateCategoryStatus,
);

export const categoryRoutes = router;
