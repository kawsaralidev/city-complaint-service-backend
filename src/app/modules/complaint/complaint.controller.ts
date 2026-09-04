import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { complaintService } from "./complaint.service";
import { ComplaintStatus } from "../../../../generated/prisma/enums";
import { uploadToCloudinary } from "../../utils/cloudinary";

// Create Complaint
const createComplaint = async (req: Request, res: Response) => {
  const { title, description, location, categoryId } = req.body;

  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  // Upload image to Cloudinary
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "city-complaints");

    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const complaint = await complaintService.createComplaint(citizenId, {
    title,
    description,
    location,
    categoryId,
    imageUrl,
    imagePublicId,
  });

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Complaint created successfully.",
    data: complaint,
  });
};

// Get citizen's complaints
const getMyComplaints = async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new Error("Authenticated user not found.");
  }

  const complaints = await complaintService.getMyComplaints(citizenId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaints retrieved successfully.",
    data: complaints,
  });
};

// Get complaint by ID
const getComplaintById = async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId || !role) {
    throw new Error("Authenticated user not found.");
  }

  const complaint = await complaintService.getComplaintById(
    complaintId,
    userId,
    role,
  );
  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaint retrieved successfully.",
    data: complaint,
  });
};

// Get all complaints
const getAllComplaints = async (req: Request, res: Response) => {
  const result = await complaintService.getAllComplaints(
    req.query as {
      page?: number;
      limit?: number;
      search?: string;
      status?: ComplaintStatus;
      categoryId?: string;
    },
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaints retrieved successfully.",
    data: result.complaints,
    pagination: result.pagination,
  });
};

// Update Complaint
const updateComplaint = async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const citizenId = req.user?.userId;

  if (!citizenId) throw new Error("Authenticated user not found.");
  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  // Upload new image to Cloudinary
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "city-complaints");

    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const complaint = await complaintService.updateComplaint(
    complaintId,
    citizenId,
    {
      ...req.body,
      imageUrl,
      imagePublicId,
    },
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaint updated successfully.",
    data: complaint,
  });
};

// Assign Complaint
const assignComplaint = async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const assignedBy = req.user?.userId;
  const { officerId } = req.body;

  if (!assignedBy) {
    throw new Error("Authenticated user not found.");
  }

  const result = await complaintService.assignComplaint(
    complaintId,
    officerId,
    assignedBy,
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaint assigned successfully.",
    data: result,
  });
};

// Get Officer's assigned complaints
const getAssignedComplaints = async (req: Request, res: Response) => {
  const officerId = req.user?.userId;

  if (!officerId) {
    throw new Error("Authenticated user not found.");
  }

  const complaints = await complaintService.getAssignedComplaints(officerId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Assigned complaints retrieved successfully.",
    data: complaints,
  });
};

// Update Complaint Status
const updateComplaintStatus = async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  const role = req.user?.role;
  const { status } = req.body;

  if (!userId || !role) {
    throw new Error("Authenticated user not found.");
  }

  const complaint = await complaintService.updateComplaintStatus(
    complaintId,
    userId,
    role,
    status,
  );

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Complaint status updated successfully.",
    data: complaint,
  });
};

// Add Complaint Resolution
const createComplaintResolution = async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const officerId = req.user?.userId;

  if (!officerId) {
    throw new Error("Authenticated user not found.");
  }

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  // Upload resolution image to Cloudinary
  if (req.file) {
    const result = await uploadToCloudinary(
      req.file.buffer,
      "city-complaint-resolutions",
    );

    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const result = await complaintService.createComplaintResolution(
    complaintId,
    officerId,
    {
      ...req.body,
      imageUrl,
      imagePublicId,
    },
  );

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Complaint resolution added successfully.",
    data: result,
  });
};

export const complaintController = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
  assignComplaint,
  getAssignedComplaints,
  updateComplaintStatus,
  createComplaintResolution,
};
