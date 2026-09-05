import { prisma } from "../../lib/prisma";
import { ICreateServiceRequestPayload } from "./service-request.interface";

const createServiceRequest = async (
  citizenId: string,
  payload: ICreateServiceRequestPayload,
) => {
  // Check if service exists
  const service = await prisma.service.findUnique({
    where: {
      id: payload.serviceId,
    },
  });

  // Throw an error if service does not exist
  if (!service) {
    throw new Error("Service not found.");
  }

  // Throw an error if service is inactive
  if (!service.isActive) {
    throw new Error("This service is currently inactive.");
  }

  // Create service request
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      citizenId,
      serviceId: payload.serviceId,
      description: payload.description,
      location: payload.location,
      amount: service.baseFee,
      status: "PAYMENT_PENDING",
    },
    include: {
      service: true,
    },
  });

  return serviceRequest;
};

const getMyServiceRequests = async (citizenId: string) => {
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      citizenId,
      deletedAt: null,
    },
    include: {
      service: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return serviceRequests;
};

const getServiceRequestById = async (id: string, citizenId: string) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id,
      citizenId,
      deletedAt: null,
    },
    include: {
      service: true,
      payment: true,
    },
  });

  // Throw an error if service request does not exist
  if (!serviceRequest) {
    throw new Error("Service request not found.");
  }

  return serviceRequest;
};

export const serviceRequestService = {
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestById,
};
