import { prisma } from "../../lib/prisma";
import { IGetAllAuditLogsParams } from "./audit-log.interface";

const getAllAuditLogs = async ({
  page,
  limit,
  search,
  action,
  entity,
  sortBy,
  sortOrder,
}: IGetAllAuditLogsParams) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        {
          action: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          entity: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      ],
    }),

    ...(action && {
      action: {
        contains: action,
        mode: "insensitive" as const,
      },
    }),

    ...(entity && {
      entity: {
        contains: entity,
        mode: "insensitive" as const,
      },
    }),
  };

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
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
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  return {
    data: auditLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const auditLogService = {
  getAllAuditLogs,
};
