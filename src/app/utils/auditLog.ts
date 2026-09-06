import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../lib/prisma";

interface CreateAuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
}

export const createAuditLog = async ({
  userId,
  action,
  entity,
  entityId,
  details,
}: CreateAuditLogParams) => {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details,
    },
  });
};
