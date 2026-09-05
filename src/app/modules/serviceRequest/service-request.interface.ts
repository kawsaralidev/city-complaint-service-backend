export interface ICreateServiceRequestPayload {
  serviceId: string;
  description?: string;
  location: string;
}

export interface IReviewServiceRequestPayload {
  status: "APPROVED" | "REJECTED";
}

export interface IAssignServiceRequestPayload {
  officerId: string;
}
