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

export const complaintRoutes = router;
