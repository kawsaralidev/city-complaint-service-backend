import { prisma } from "../../lib/prisma";

const createService = async (data: {
  name: string;
  description?: string;
  baseFee: number;
}) => {
  // Check if service already exists
  const existingService = await prisma.service.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existingService) {
    throw new Error("A service with this name already exists.");
  }

  // Create service
  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      baseFee: data.baseFee,
    },
  });

  return service;
};

const getActiveServices = async () => {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return services;
};

const updateService = async (
  serviceId: string,
  data: {
    name?: string;
    description?: string;
    baseFee?: number;
    isActive?: boolean;
  },
) => {
  const existingService = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!existingService) {
    throw new Error("Service not found.");
  }

  if (data.name && data.name !== existingService.name) {
    const duplicateService = await prisma.service.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicateService) {
      throw new Error("A service with this name already exists.");
    }
  }

  const service = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data,
  });

  return service;
};

export const serviceService = {
  createService,
  getActiveServices,
  updateService,
};
