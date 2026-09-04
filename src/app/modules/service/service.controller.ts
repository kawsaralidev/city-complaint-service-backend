import { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { serviceService } from "./service.service";

const createService = async (req: Request, res: Response) => {
  const service = await serviceService.createService(req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Service created successfully.",
    data: service,
  });
};

const getActiveServices = async (req: Request, res: Response) => {
  const services = await serviceService.getActiveServices();

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Services retrieved successfully.",
    data: services,
  });
};

const updateService = async (req: Request, res: Response) => {
  const serviceId = req.params.id as string;

  const service = await serviceService.updateService(serviceId, req.body);

  res.status(HttpStatus.OK).json({
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
