import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { serviceRequestService } from "./service-request.service";
import { getAllServiceRequestsQuerySchema } from "./service-request.validation";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

const createServiceRequest = async (req: Request, res: Response) => {
	const citizenId = req.user?.userId;

	if (!citizenId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const serviceRequest = await serviceRequestService.createServiceRequest(
		citizenId,
		req.body,
		req.file,
	);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Service request created successfully.",
		data: serviceRequest,
	});
};

const getAllServiceRequests = async (req: Request, res: Response) => {
	const query = getAllServiceRequestsQuerySchema.parse(req.query);

	const serviceRequests = await serviceRequestService.getAllServiceRequests({
		page: query.page,
		limit: query.limit,
		search: query.search,
		status: query.status,
		serviceId: query.serviceId,
		sortOrder: query.sortOrder,
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service requests retrieved successfully.",
		data: serviceRequests,
	});
};

const getMyServiceRequests = async (req: Request, res: Response) => {
	const citizenId = req.user?.userId;

	if (!citizenId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const serviceRequests =
		await serviceRequestService.getMyServiceRequests(citizenId);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service requests retrieved successfully.",
		data: serviceRequests,
	});
};

const getServiceRequestById = async (req: Request, res: Response) => {
	const citizenId = req.user?.userId;

	if (!citizenId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const id = req.params.id as string;

	const serviceRequest = await serviceRequestService.getServiceRequestById(
		id,
		citizenId,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service request retrieved successfully.",
		data: serviceRequest,
	});
};

const UpdateServiceRequestStatus = async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const adminId = req.user?.userId;

	if (!adminId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const serviceRequest = await serviceRequestService.UpdateServiceRequestStatus(
		id,
		adminId,
		req.body,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: `Service request ${req.body.status.toLowerCase()} successfully.`,
		data: serviceRequest,
	});
};

// Assign service request to officer
const assignServiceRequest = async (req: Request, res: Response) => {
	const adminId = req.user?.userId;

	if (!adminId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const serviceRequestId = req.params.id as string;

	const result = await serviceRequestService.assignServiceRequest(
		serviceRequestId,
		adminId,
		req.body,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service request assigned successfully.",
		data: result,
	});
};

const updateServiceRequestInProgressStatus = async (
	req: Request,
	res: Response,
) => {
	const officerId = req.user?.userId;

	if (!officerId) {
		throw new AppError(
			HttpStatus.UNAUTHORIZED,
			"Authenticated user not found.",
		);
	}

	const serviceRequestId = req.params.id as string;

	const serviceRequest =
		await serviceRequestService.updateServiceRequestInProgressStatus(
			serviceRequestId,
			officerId,
			req.body,
		);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service request status updated successfully.",
		data: serviceRequest,
	});
};

// Delete Service Request
const deleteServiceRequest = async (req: Request, res: Response) => {
	const serviceRequestId = req.params.id as string;
	const citizenId = req.user!.userId;

	const serviceRequest = await serviceRequestService.deleteServiceRequest(
		serviceRequestId,
		citizenId,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service request deleted successfully.",
		data: serviceRequest,
	});
};

export const serviceRequestController = {
	createServiceRequest,
	getAllServiceRequests,
	getMyServiceRequests,
	getServiceRequestById,
	UpdateServiceRequestStatus,
	assignServiceRequest,
	updateServiceRequestInProgressStatus,
	deleteServiceRequest,
};
