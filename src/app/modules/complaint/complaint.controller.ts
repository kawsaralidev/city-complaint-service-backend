import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { complaintService } from "./complaint.service";
import type { ComplaintStatus, Role } from "../../../../generated/prisma/enums";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";

// Create Complaint
const createComplaint = catchAsync(async (req: Request, res: Response) => {
  const { title, description, location, categoryId } = req.body;

  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
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

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Complaint created successfully.",
    data: complaint,
  });
});

// Get citizen's complaints
const getMyComplaints = catchAsync(async (req: Request, res: Response) => {
  const citizenId = req.user?.userId;

  if (!citizenId) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
  }

  const complaints = await complaintService.getMyComplaints(citizenId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaints retrieved successfully.",
    data: complaints,
  });
});

// Get complaint by ID
const getComplaintById = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId || !role) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
  }

  const complaint = await complaintService.getComplaintById(
    complaintId,
    userId,
    role,
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaint retrieved successfully.",
    data: complaint,
  });
});

// Get all complaints
const getAllComplaints = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId || !role) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
  }

  const result = await complaintService.getAllComplaints(
    req.query as {
      page?: number;
      limit?: number;
      search?: string;
      status?: ComplaintStatus;
      categoryId?: string;
    },
    role,
    userId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaints retrieved successfully.",
    data: result.complaints,
    meta: result.pagination,
  });
});

// Update Complaint
const updateComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const citizenId = req.user?.userId;

  if (!citizenId)
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
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

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaint updated successfully.",
    data: complaint,
  });
});

// Get Active Officers
const getActiveOfficers = catchAsync(async (req: Request, res: Response) => {
  const officers = await complaintService.getActiveOfficers();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Active officers retrieved successfully.",
    data: officers,
  });
});

// Assign Complaint
const assignComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const assignedBy = req.user?.userId;
  const { officerId } = req.body;

  if (!assignedBy) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Authenticated user not found.",
    );
  }

  const result = await complaintService.assignComplaint(
    complaintId,
    officerId,
    assignedBy,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaint assigned successfully.",
    data: result,
  });
});

// Get Officer's assigned complaints
const getAssignedComplaints = catchAsync(
  async (req: Request, res: Response) => {
    const officerId = req.user?.userId;

    if (!officerId) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "Authenticated user not found.",
      );
    }

    const complaints = await complaintService.getAssignedComplaints(officerId);

    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Assigned complaints retrieved successfully.",
      data: complaints,
    });
  },
);

// Update Complaint Status
const updateComplaintStatus = catchAsync(
  async (req: Request, res: Response) => {
    const complaintId = req.params.id as string;
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { status } = req.body;

    if (!userId || !role) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "Authenticated user not found.",
      );
    }

    const complaint = await complaintService.updateComplaintStatus(
      complaintId,
      userId,
      role,
      status,
    );

    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Complaint status updated successfully.",
      data: complaint,
    });
  },
);

const cancelComplaint = catchAsync(async (req: Request, res: Response) => {
  const citizenId = req.user!.userId;

  const result = await complaintService.cancelComplaint(
    req.params.id as string,
    citizenId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaint canceled successfully.",
    data: result,
  });
});

// Delete Complaint
const deleteComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaintId = req.params.id as string;
  const userId = req.user?.userId;
  const role = req.user?.role;

  const complaint = await complaintService.deleteComplaint(
    complaintId,
    userId as string,
    role as Role,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Complaint deleted successfully.",
    data: complaint,
  });
});

export const complaintController = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
  getActiveOfficers,
  assignComplaint,
  getAssignedComplaints,
  updateComplaintStatus,
  cancelComplaint,
  deleteComplaint,
};
