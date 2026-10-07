import { prisma } from "../../lib/prisma";
import { HttpStatus } from "../../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import type { IGetServicesParams } from "./service.interface";
import { createAuditLog } from "../../utils/auditLog";
import { uploadToCloudinary } from "../../utils/cloudinary";

const createService = async (
  data: {
    name: string;
    description?: string;
    baseFee: number;
  },
  userId: string,
  image?: Express.Multer.File,
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

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  // Upload service image to Cloudinary
  if (image) {
    const uploadedImage = await uploadToCloudinary(
      image.buffer,
      "city-complaints/services",
    );

    imageUrl = uploadedImage.secure_url;
    imagePublicId = uploadedImage.public_id;
  }

  // Create service
  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      baseFee: data.baseFee,
      imageUrl,
      imagePublicId,
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

const getServiceById = async (serviceId: string) => {
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    throw new AppError(HttpStatus.NOT_FOUND, "Service not found.");
  }

  return service;
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
  image?: Express.Multer.File,
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

  let imageUrl = existingService.imageUrl;
  let imagePublicId = existingService.imagePublicId;

  // Upload new service image if provided
  if (image) {
    const uploadedImage = await uploadToCloudinary(
      image.buffer,
      "city-complaints/services",
    );

    imageUrl = uploadedImage.secure_url;
    imagePublicId = uploadedImage.public_id;
  }

  const service = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data: {
      ...data,
      imageUrl,
      imagePublicId,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "SERVICE",
    entityId: service.id,
    details: {
      changes: {
        ...data,
        ...(image ? { imageUrl, imagePublicId } : {}),
      },
    },
  });

  return service;
};
export const serviceService = {
  createService,
  getActiveServices,
  getAllServices,
  getServiceById,
  updateService,
};
