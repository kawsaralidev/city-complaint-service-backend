import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createServiceSchema } from "./service.validation";
import { serviceController } from "./service.controller";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createServiceSchema),
  serviceController.createService,
);

export const serviceRoutes = router;
