import { Router } from "express";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { categoryController } from "./category.controller";
import { createCategorySchema } from "./ategory.validation";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

export const categoryRoutes = router;
