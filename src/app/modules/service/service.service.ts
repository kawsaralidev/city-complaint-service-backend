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

export const serviceService = {
  createService,
};
