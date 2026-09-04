import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { complaintService } from "./complaint.service";

// Create Complaint
const createComplaint = async (req: Request, res: Response) => {
  const { title, description, location, categoryId } = req.body;

  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const complaint = await complaintService.createComplaint(citizenId, {
    title,
    description,
    location,
    categoryId,
  });

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Complaint created successfully.",
    data: complaint,
  });
};

export const complaintController = {
  createComplaint,
};
