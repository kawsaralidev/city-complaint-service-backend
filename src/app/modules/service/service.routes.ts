import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createServiceSchema, updateServiceSchema } from "./service.validation";
import { serviceController } from "./service.controller";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createServiceSchema),
  serviceController.createService,
);

router.get(
  "/",
  auth(Role.CITIZEN, Role.OFFICER, Role.ADMIN),
  serviceController.getActiveServices,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateServiceSchema),
  serviceController.updateService,
);

export const serviceRoutes = router;
