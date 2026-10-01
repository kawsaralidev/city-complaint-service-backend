import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { serviceService } from "./service.service";
import { getServicesQuerySchema } from "./service.validation";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const createService = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  const userId = req.user?.userId as string;
  const service = await serviceService.createService(body, userId);

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Service created successfully.",
    data: service,
  });
});

const getActiveServices = catchAsync(async (req: Request, res: Response) => {
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
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const query = getServicesQuerySchema.parse(req.query);

  const services = await serviceService.getAllServices({
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
    message: "All services retrieved successfully.",
    data: services,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const serviceId = req.params.id as string;
  const userId = req.user?.userId as string;

  const service = await serviceService.updateService(
    serviceId,
    req.body,
    userId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Service updated successfully.",
    data: service,
  });
});

export const serviceController = {
  createService,
  getActiveServices,
  getAllServices,
  updateService,
};
