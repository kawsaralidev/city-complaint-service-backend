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

router.get(
  "/",
  auth(Role.ADMIN),
  serviceRequestController.getAllServiceRequests,
);

router.get(
  "/my",
  auth(Role.CITIZEN),
  serviceRequestController.getMyServiceRequests,
);

router.get(
  "/:id",
  auth(Role.CITIZEN),
  serviceRequestController.getServiceRequestById,
);

export const serviceRequestRoutes = router;
