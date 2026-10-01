import { prisma } from "../../lib/prisma";
import { HttpStatus } from "../../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import type { IGetServicesParams } from "./service.interface";
import { createAuditLog } from "../../utils/auditLog";

const createService = async (
  data: {
    name: string;
    description?: string;
    baseFee: number;
  },
  userId: string,
) => {
  // Check if service already exists
  const existingService = await prisma.service.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingService) {
    throw new AppError(
      HttpStatus.CONFLICT,
      "A service with this name already exists.",
    );
  }

  // Create service
  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      baseFee: data.baseFee,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "SERVICE",
    entityId: service.id,
    details: {
      name: service.name,
      baseFee: service.baseFee,
    },
  });

  return service;
};

const getActiveServices = async ({
  page,
  limit,
  search,
  minFee,
  maxFee,
  sortOrder,
}: IGetServicesParams) => {
  const skip = (page - 1) * limit;

  // Build service filters
  const where = {
    isActive: true,

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),

    ...((minFee !== undefined || maxFee !== undefined) && {
      baseFee: {
        ...(minFee !== undefined && {
          gte: minFee,
        }),
        ...(maxFee !== undefined && {
          lte: maxFee,
        }),
      },
    }),
  };

  // Get services and total count
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: {
        createdAt: sortOrder,
      },
      skip,
      take: limit,
    }),

    prisma.service.count({
      where,
    }),
  ]);

  return {
    data: services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllServices = async ({
  page,
  limit,
  search,
  minFee,
  maxFee,
  sortOrder,
}: IGetServicesParams) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),

    ...((minFee !== undefined || maxFee !== undefined) && {
      baseFee: {
        ...(minFee !== undefined && {
          gte: minFee,
        }),
        ...(maxFee !== undefined && {
          lte: maxFee,
        }),
      },
    }),
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: {
        createdAt: sortOrder,
      },
      skip,
      take: limit,
    }),

    prisma.service.count({
      where,
    }),
  ]);

  return {
    data: services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateService = async (
  serviceId: string,
  data: {
    name?: string;
    description?: string;
    baseFee?: number;
    isActive?: boolean;
  },
  userId: string,
) => {
  const existingService = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!existingService) {
    throw new AppError(HttpStatus.NOT_FOUND, "Service not found.");
  }

  if (data.name && data.name !== existingService.name) {
    const duplicateService = await prisma.service.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicateService) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "A service with this name already exists.",
      );
    }
  }

  const service = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data,
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "SERVICE",
    entityId: service.id,
    details: {
      changes: data,
    },
  });

  return service;
};
export const serviceService = {
  createService,
  getActiveServices,
  getAllServices,
  updateService,
};
