import { Router } from "express";

import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { complaintController } from "./complaint.controller";
import { createComplaintSchema } from "./complaint.validation";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.CITIZEN),
  validateRequest(createComplaintSchema),
  complaintController.createComplaint,
);

router.get("/my", auth(Role.CITIZEN), complaintController.getMyComplaints);

router.get("/:id", auth(Role.CITIZEN), complaintController.getComplaintById);

export const complaintRoutes = router;
