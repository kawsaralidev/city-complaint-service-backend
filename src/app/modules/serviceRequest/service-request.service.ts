import { HttpStatus } from "../../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { ServiceRequestStatus } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/auditLog";
import { uploadToCloudinary } from "../../utils/cloudinary";
import type {
	IAssignServiceRequestPayload,
	ICreateServiceRequestPayload,
	IGetAllServiceRequestsParams,
	IReviewServiceRequestPayload,
	IUpdateServiceRequestStatusInProgressPayload,
} from "./service-request.interface";

const createServiceRequest = async (
	citizenId: string,
	payload: ICreateServiceRequestPayload,
	image?: Express.Multer.File,
) => {
	// Check if service exists
	const service = await prisma.service.findUnique({
		where: {
			id: payload.serviceId,
		},
	});

	// Throw an error if service does not exist
	if (!service) {
		throw new AppError(HttpStatus.NOT_FOUND, "Service not found.");
	}

	// Throw an error if service is inactive
	if (!service.isActive) {
		throw new AppError(HttpStatus.BAD_REQUEST, "This service is currently inactive.");
	}

	let imageUrl: string | undefined;
	let imagePublicId: string | undefined;

	// Upload image to Cloudinary if provided
	if (image) {
		const uploadedImage = await uploadToCloudinary(
			image.buffer,
			"city-complaints/service-requests",
		);

		imageUrl = uploadedImage.secure_url;
		imagePublicId = uploadedImage.public_id;
	}

	// Create service request
	const serviceRequest = await prisma.serviceRequest.create({
		data: {
			citizenId,
			serviceId: payload.serviceId,
			description: payload.description,
			location: payload.location,
			imageUrl,
			imagePublicId,
			amount: service.baseFee,
			status: "PENDING",
		},
		include: {
			service: true,
		},
	});

	// Create audit log
	await createAuditLog({
		userId: citizenId,
		action: "CREATE_SERVICE_REQUEST",
		entity: "ServiceRequest",
		entityId: serviceRequest.id,
		details: {
			serviceId: serviceRequest.serviceId,
			amount: serviceRequest.amount.toString(),
		},
	});

	return serviceRequest;
};

const getAllServiceRequests = async ({
	page,
	limit,
	search,
	status,
	serviceId,
	sortOrder,
}: IGetAllServiceRequestsParams) => {
	const skip = (page - 1) * limit;

	const where = {
		deletedAt: null,

		...(status && {
			status,
		}),

		...(serviceId && {
			serviceId,
		}),

		...(search && {
			OR: [
				{
					location: {
						contains: search,
						mode: "insensitive" as const,
					},
				},
				{
					description: {
						contains: search,
						mode: "insensitive" as const,
					},
				},
				{
					citizen: {
						name: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				},
				{
					citizen: {
						email: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				},
				{
					service: {
						name: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				},
			],
		}),
	};

	const [serviceRequests, total] = await Promise.all([
		prisma.serviceRequest.findMany({
			where,
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
				createdAt: sortOrder,
			},
			skip,
			take: limit,
		}),

		prisma.serviceRequest.count({
			where,
		}),
	]);

	return {
		data: serviceRequests,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
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
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found.");
	}

	return serviceRequest;
};

const UpdateServiceRequestStatus = async (
	id: string,
	adminId: string,
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
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found.");
	}

	// Throw an error if request is not pending
	if (serviceRequest.status !== "PENDING") {
		throw new AppError(HttpStatus.BAD_REQUEST, "Only pending service requests can be reviewed.");
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

	// Create audit log
	await createAuditLog({
		userId: adminId,
		action: "REVIEW_SERVICE_REQUEST",
		entity: "ServiceRequest",
		entityId: id,
		details: {
			previousStatus: serviceRequest.status,
			newStatus: payload.status,
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
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found.");
	}

	// Check if payment is completed
	if (serviceRequest.status !== "CONFIRMED") {
		throw new AppError(HttpStatus.BAD_REQUEST, "Only confirmed service requests can be assigned.");
	}

	if (serviceRequest.payment?.status !== "PAID") {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
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
		throw new AppError(HttpStatus.NOT_FOUND, "Active officer not found.");
	}

	// Check if service request is already assigned
	const existingAssignment = await prisma.assignment.findUnique({
		where: {
			serviceRequestId,
		},
	});

	if (existingAssignment) {
		throw new AppError(HttpStatus.CONFLICT, "This service request has already been assigned.");
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

	// Create audit log
	await createAuditLog({
		userId: adminId,
		action: "ASSIGN_SERVICE_REQUEST",
		entity: "ServiceRequest",
		entityId: serviceRequestId,
		details: {
			officerId: payload.officerId,
		},
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
		throw new AppError(HttpStatus.FORBIDDEN, "Service request not found or not assigned to you.");
	}

	// Check valid status transition
	if (
		serviceRequest.status === "ASSIGNED" &&
		payload.status !== "IN_PROGRESS"
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			"Assigned service requests can only be moved to in progress.",
		);
	}

	if (
		serviceRequest.status === "IN_PROGRESS" &&
		payload.status !== "COMPLETED"
	) {
		throw new AppError(HttpStatus.BAD_REQUEST, "In-progress service requests can only be completed.");
	}

	// Throw an error for invalid current status
	if (
		serviceRequest.status !== "ASSIGNED" &&
		serviceRequest.status !== "IN_PROGRESS"
	) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
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

	// Create audit log
	await createAuditLog({
		userId: officerId,
		action: "UPDATE_SERVICE_REQUEST_STATUS",
		entity: "ServiceRequest",
		entityId: serviceRequestId,
		details: {
			previousStatus: serviceRequest.status,
			newStatus: payload.status,
		},
	});

	return updatedServiceRequest;
};

// Delete Service Request
const deleteServiceRequest = async (
	serviceRequestId: string,
	citizenId: string,
) => {
	// Check if service request exists
	const serviceRequest = await prisma.serviceRequest.findFirst({
		where: {
			id: serviceRequestId,
			citizenId,
			deletedAt: null,
		},
	});

	if (!serviceRequest) {
		throw new AppError(HttpStatus.NOT_FOUND, "Service request not found.");
	}

	// Check service request status
	if (serviceRequest.status !== ServiceRequestStatus.PENDING) {
		throw new AppError(HttpStatus.BAD_REQUEST, "Only pending service requests can be deleted.");
	}

	// Soft delete service request
	const deletedServiceRequest = await prisma.serviceRequest.update({
		where: {
			id: serviceRequestId,
		},
		data: {
			deletedAt: new Date(),
		},
	});

	// Create audit log
	await createAuditLog({
		userId: citizenId,
		action: "DELETE_SERVICE_REQUEST",
		entity: "ServiceRequest",
		entityId: deletedServiceRequest.id,
		details: {
			softDeleted: true,
		},
	});

	return deletedServiceRequest;
};

export const serviceRequestService = {
	createServiceRequest,
	getAllServiceRequests,
	getMyServiceRequests,
	getServiceRequestById,
	UpdateServiceRequestStatus,
	assignServiceRequest,
	updateServiceRequestInProgressStatus,
	deleteServiceRequest,
};
