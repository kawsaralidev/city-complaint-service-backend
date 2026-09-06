import { prisma } from "../../lib/prisma";

const getAllAuditLogs = async () => {
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return auditLogs;
};

export const auditLogService = {
  getAllAuditLogs,
};
