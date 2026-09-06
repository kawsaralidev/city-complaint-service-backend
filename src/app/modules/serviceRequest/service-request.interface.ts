import { ServiceRequestStatus } from "../../../../generated/prisma/enums";

export interface ICreateServiceRequestPayload {
  serviceId: string;
  description?: string;
  location: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface IReviewServiceRequestPayload {
  status: "APPROVED" | "REJECTED";
}

export interface IAssignServiceRequestPayload {
  officerId: string;
}

export interface IUpdateServiceRequestStatusInProgressPayload {
  status: "IN_PROGRESS" | "COMPLETED";
}

export interface IGetAllServiceRequestsParams {
  page: number;
  limit: number;
  search?: string;
  status?: ServiceRequestStatus;
  serviceId?: string;
  sortOrder: "asc" | "desc";
}
