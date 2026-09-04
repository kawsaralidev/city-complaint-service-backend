import { Router } from "express";

import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { complaintController } from "./complaint.controller";
import {
  assignComplaintSchema,
  createComplaintResolutionSchema,
  createComplaintSchema,
  getAllComplaintsSchema,
  updateComplaintSchema,
  updateComplaintStatusSchema,
} from "./complaint.validation";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.CITIZEN),
  validateRequest(createComplaintSchema),
  complaintController.createComplaint,
);

router.get("/my", auth(Role.CITIZEN), complaintController.getMyComplaints);

router.get(
  "/assigned",
  auth(Role.OFFICER),
  complaintController.getAssignedComplaints,
);

router.get(
  "/:id",
  auth(Role.CITIZEN, Role.ADMIN, Role.OFFICER),
  complaintController.getComplaintById,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.OFFICER),
  validateRequest(getAllComplaintsSchema),
  complaintController.getAllComplaints,
);

router.patch(
  "/:id",
  auth(Role.CITIZEN),
  validateRequest(updateComplaintSchema),
  complaintController.updateComplaint,
);

router.patch(
  "/:id/assign",
  auth(Role.ADMIN),
  validateRequest(assignComplaintSchema),
  complaintController.assignComplaint,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.OFFICER),
  validateRequest(updateComplaintStatusSchema),
  complaintController.updateComplaintStatus,
);

router.post(
  "/:id/resolution",
  auth(Role.OFFICER),
  validateRequest(createComplaintResolutionSchema),
  complaintController.createComplaintResolution,
);

export const complaintRoutes = router;
