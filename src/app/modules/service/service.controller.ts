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

export const serviceController = {
  createService,
};
