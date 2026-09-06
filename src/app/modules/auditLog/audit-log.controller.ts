import { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { auditLogService } from "./audit-log.service";

const getAllAuditLogs = async (_req: Request, res: Response) => {
  const auditLogs = await auditLogService.getAllAuditLogs();

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Audit logs retrieved successfully.",
    data: auditLogs,
  });
};

export const auditLogController = {
  getAllAuditLogs,
};
