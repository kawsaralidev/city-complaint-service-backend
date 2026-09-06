import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { auditLogController } from "./audit-log.controller";

const router = Router();

router.get("/", auth(Role.ADMIN), auditLogController.getAllAuditLogs);

export const auditLogRoutes = router;
