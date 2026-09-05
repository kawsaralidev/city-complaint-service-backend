import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createServiceRequestSchema,
  reviewServiceRequestSchema,
} from "./service-request.validation";
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
  "/my-service-request",
  auth(Role.CITIZEN),
  serviceRequestController.getMyServiceRequests,
);

router.get(
  "/:id",
  auth(Role.CITIZEN),
  serviceRequestController.getServiceRequestById,
);

router.patch(
  "/:id/service-request-status",
  auth(Role.ADMIN),
  validateRequest(reviewServiceRequestSchema),
  serviceRequestController.reviewServiceRequest,
);

export const serviceRequestRoutes = router;
