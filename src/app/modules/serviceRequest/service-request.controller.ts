import { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { serviceRequestService } from "./service-request.service";

const createServiceRequest = async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const serviceRequest = await serviceRequestService.createServiceRequest(
    citizenId,
    req.body,
  );

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Service request created successfully.",
    data: serviceRequest,
  });
};

const getMyServiceRequests = async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const serviceRequests =
    await serviceRequestService.getMyServiceRequests(citizenId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Service requests retrieved successfully.",
    data: serviceRequests,
  });
};

export const serviceRequestController = {
  createServiceRequest,
  getMyServiceRequests,
};
