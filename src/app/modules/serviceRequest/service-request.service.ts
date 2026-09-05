import { prisma } from "../../lib/prisma";
import {
  ICreateServiceRequestPayload,
  IReviewServiceRequestPayload,
} from "./service-request.interface";

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
      status: "PENDING",
    },
    include: {
      service: true,
    },
  });

  return serviceRequest;
};

const getAllServiceRequests = async () => {
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return serviceRequests;
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

const reviewServiceRequest = async (
  id: string,
  payload: IReviewServiceRequestPayload,
) => {
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  // Throw an error if service request does not exist
  if (!serviceRequest) {
    throw new Error("Service request not found.");
  }

  // Throw an error if request is not pending
  if (serviceRequest.status !== "PENDING") {
    throw new Error("Only pending service requests can be reviewed.");
  }

  const updatedServiceRequest = await prisma.serviceRequest.update({
    where: {
      id,
    },
    data: {
      status: payload.status,
    },
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: true,
    },
  });

  return updatedServiceRequest;
};

export const serviceRequestService = {
  createServiceRequest,
  getAllServiceRequests,
  getMyServiceRequests,
  getServiceRequestById,
  reviewServiceRequest,
};
