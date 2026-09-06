import { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { auditLogService } from "./audit-log.service";
import { getAllAuditLogsQuerySchema } from "./audit-log.validation";

const getAllAuditLogs = async (req: Request, res: Response) => {
  // Validate audit log query parameters
  const query = getAllAuditLogsQuerySchema.parse(req.query);

  const page = query.page;
  const limit = query.limit;

  const search = query.search;
  const action = query.action;
  const entity = query.entity;

  const sortBy = "createdAt";

  const sortOrder = query.sortOrder;

  const auditLogs = await auditLogService.getAllAuditLogs({
    page,
    limit,
    search,
    action,
    entity,
    sortBy,
    sortOrder,
  });

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Audit logs retrieved successfully.",
    data: auditLogs,
  });
};

export const auditLogController = {
  getAllAuditLogs,
};
