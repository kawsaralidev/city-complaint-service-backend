import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { serviceService } from "./service.service";
import { getServicesQuerySchema } from "./service.validation";
import { sendResponse } from "../../utils/sendResponse";

const createService = async (req: Request, res: Response) => {
	const service = await serviceService.createService(req.body);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Service created successfully.",
		data: service,
	});
};

const getActiveServices = async (req: Request, res: Response) => {
	const query = getServicesQuerySchema.parse(req.query);

	const services = await serviceService.getActiveServices({
		page: query.page,
		limit: query.limit,
		search: query.search,
		minFee: query.minFee,
		maxFee: query.maxFee,
		sortOrder: query.sortOrder,
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Services retrieved successfully.",
		data: services,
	});
};

const updateService = async (req: Request, res: Response) => {
	const serviceId = req.params.id as string;

	const service = await serviceService.updateService(serviceId, req.body);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Service updated successfully.",
		data: service,
	});
};

export const serviceController = {
	createService,
	getActiveServices,
	updateService,
};
