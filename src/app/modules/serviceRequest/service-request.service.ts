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

export const serviceRequestService = {
  createServiceRequest,
};
