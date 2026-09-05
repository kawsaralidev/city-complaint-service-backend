import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createServiceRequestSchema } from "./service-request.validation";
import { serviceRequestController } from "./service-request.controller";

const router = Router();

router.post(
  "/",
  auth(Role.CITIZEN),
  validateRequest(createServiceRequestSchema),
  serviceRequestController.createServiceRequest,
);

export const serviceRequestRoutes = router;
