import { prisma } from "../../lib/prisma";
import {
  IAssignServiceRequestPayload,
  ICreateServiceRequestPayload,
  IReviewServiceRequestPayload,
  IUpdateServiceRequestStatusInProgressPayload,
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

const UpdateServiceRequestStatus = async (
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

const assignServiceRequest = async (
  serviceRequestId: string,
  adminId: string,
  payload: IAssignServiceRequestPayload,
) => {
  // Check if service request exists
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      deletedAt: null,
    },
    include: {
      payment: true,
    },
  });

  // Throw an error if service request does not exist
  if (!serviceRequest) {
    throw new Error("Service request not found.");
  }

  // Check if payment is completed
  if (serviceRequest.status !== "CONFIRMED") {
    throw new Error("Only confirmed service requests can be assigned.");
  }

  if (serviceRequest.payment?.status !== "PAID") {
    throw new Error(
      "Service request cannot be assigned before payment is completed.",
    );
  }

  // Check if officer exists
  const officer = await prisma.user.findFirst({
    where: {
      id: payload.officerId,
      role: "OFFICER",
      status: "ACTIVE",
      deletedAt: null,
    },
  });

  // Throw an error if officer does not exist
  if (!officer) {
    throw new Error("Active officer not found.");
  }

  // Check if service request is already assigned
  const existingAssignment = await prisma.assignment.findUnique({
    where: {
      serviceRequestId,
    },
  });

  if (existingAssignment) {
    throw new Error("This service request has already been assigned.");
  }

  // Create assignment and update service request
  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        officerId: payload.officerId,
        serviceRequestId,
        assignedBy: adminId,
      },
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const updatedServiceRequest = await tx.serviceRequest.update({
      where: {
        id: serviceRequestId,
      },
      data: {
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        service: true,
        payment: true,
      },
    });

    return {
      assignment,
      serviceRequest: updatedServiceRequest,
    };
  });

  return result;
};

const updateServiceRequestInProgressStatus = async (
  serviceRequestId: string,
  officerId: string,
  payload: IUpdateServiceRequestStatusInProgressPayload,
) => {
  // Check if service request is assigned to the officer
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      deletedAt: null,
      assignment: {
        officerId,
      },
    },
  });

  // Throw an error if service request is not assigned to the officer
  if (!serviceRequest) {
    throw new Error("Service request not found or not assigned to you.");
  }

  // Check valid status transition
  if (
    serviceRequest.status === "ASSIGNED" &&
    payload.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "Assigned service requests can only be moved to in progress.",
    );
  }

  if (
    serviceRequest.status === "IN_PROGRESS" &&
    payload.status !== "COMPLETED"
  ) {
    throw new Error("In-progress service requests can only be completed.");
  }

  // Throw an error for invalid current status
  if (
    serviceRequest.status !== "ASSIGNED" &&
    serviceRequest.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "This service request cannot be updated at its current status.",
    );
  }

  // Update service request status
  const updatedServiceRequest = await prisma.serviceRequest.update({
    where: {
      id: serviceRequestId,
    },
    data: {
      status: payload.status,
      completedAt: payload.status === "COMPLETED" ? new Date() : undefined,
    },
    include: {
      service: true,
      payment: true,
      assignment: {
        include: {
          officer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return updateServiceRequestInProgressStatus;
};

export const serviceRequestService = {
  createServiceRequest,
  getAllServiceRequests,
  getMyServiceRequests,
  getServiceRequestById,
  UpdateServiceRequestStatus,
  assignServiceRequest,
  updateServiceRequestInProgressStatus,
};
