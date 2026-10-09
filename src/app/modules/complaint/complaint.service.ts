import { ComplaintStatus, Role } from "../../../../generated/prisma/enums";
import { HttpStatus } from "../../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { createAuditLog } from "../../utils/auditLog";
import { deleteFromCloudinary } from "../../utils/cloudinary";
import { userService } from "../user/user.service";

// Create Complaint
const createComplaint = async (
  citizenId: string,
  data: {
    title: string;
    description: string;
    location: string;
    categoryId: string;
    imageUrl?: string;
    imagePublicId?: string;
  },
) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  // Throw an error if category does not exist
  if (!category) {
    throw new AppError(HttpStatus.NOT_FOUND, "Category not found.");
  }

  // Throw an error if category is inactive
  if (!category.isActive) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "This category is currently inactive.",
    );
  }

  // Throw an error if category is not for complaints
  if (category.type !== "COMPLAINT") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "This category cannot be used for complaints.",
    );
  }

  // Create complaint
  const complaint = await prisma.complaint.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      categoryId: data.categoryId,
      citizenId,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
    },
    include: {
      category: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId: citizenId,
    action: "CREATE_COMPLAINT",
    entity: "Complaint",
    entityId: complaint.id,
    details: {
      title: complaint.title,
      categoryId: complaint.categoryId,
    },
  });

  return complaint;
};

// Get citizen's complaints
const getMyComplaints = async (citizenId: string) => {
  const complaints = await prisma.complaint.findMany({
    where: {
      citizenId,
      deletedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return complaints;
};

// Get complaint by ID
// Get complaint by ID
const getComplaintById = async (complaintId: string) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,

      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!complaint) {
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");
  }

  return complaint;
};
// Get all complaints
const getAllComplaints = async (
  query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ComplaintStatus;
    categoryId?: string;
    sortOrder?: "asc" | "desc";
  },
  role: Role,
  userId: string,
) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    categoryId,
    sortOrder = "desc",
  } = query;

  // Make sure pagination values are numbers
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  const skip = (pageNumber - 1) * limitNumber;

  const where = {
    deletedAt: null,

    // Officer can see only complaints assigned to them
    ...(role === Role.OFFICER && {
      assignment: {
        officerId: userId,
      },
    }),

    ...(status && {
      status,
    }),

    ...(categoryId && {
      categoryId,
    }),

    ...(search && {
      OR: [
        {
          title: {
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
          location: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };

  // Officer complaint priority
  const statusPriority: Record<string, number> = {
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    APPROVED: 4,
    PENDING: 5,
    REJECTED: 6,
    CANCELED: 7,
  };

  // =========================================================
  // OFFICER
  // =========================================================

  if (role === Role.OFFICER) {
    const allComplaints = await prisma.complaint.findMany({
      where,

      include: {
        category: true,

        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        assignment: true,
      },
    });

    // Assigned/In Progress complaints first
    allComplaints.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = a.assignment?.assignedAt ?? a.createdAt;
      const dateB = b.assignment?.assignedAt ?? b.createdAt;

      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const total = allComplaints.length;

    // Exactly 10 complaints per page
    const complaints = allComplaints.slice(skip, skip + limitNumber);

    return {
      complaints,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // =========================================================
  // ADMIN
  // =========================================================

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,

      include: {
        category: true,

        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        assignment: true,
      },

      orderBy: {
        createdAt: sortOrder,
      },

      // Pagination
      skip,
      take: limitNumber,
    }),

    prisma.complaint.count({
      where,
    }),
  ]);

  return {
    complaints,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

// Get public complaints
const getPublicComplaints = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const {
    page = 1,
    limit = 10,
    search,
    categoryId,
    sortOrder = "desc",
  } = query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  const skip = (pageNumber - 1) * limitNumber;

  const where = {
    deletedAt: null,

    status: {
      in: [
        ComplaintStatus.APPROVED,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.COMPLETED,
      ],
    },

    ...(categoryId && {
      categoryId,
    }),

    ...(search && {
      OR: [
        {
          title: {
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
          location: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,

      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        category: true,
      },

      orderBy: {
        createdAt: sortOrder,
      },

      skip,
      take: limitNumber,
    }),

    prisma.complaint.count({
      where,
    }),
  ]);

  return {
    complaints,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

// Update Complaint
const updateComplaint = async (
  complaintId: string,
  citizenId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    categoryId?: string;
    imageUrl?: string;
    imagePublicId?: string;
  },
) => {
  // Check if complaint exists
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      citizenId,
      deletedAt: null,
    },
  });

  if (!complaint)
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");

  // Check complaint status
  if (complaint.status !== ComplaintStatus.PENDING) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Only pending complaints can be edited.",
    );
  }

  // Check category if categoryId is provided
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category)
      throw new AppError(HttpStatus.NOT_FOUND, "Category not found.");

    if (!category.isActive) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "This category is currently inactive.",
      );
    }

    if (category.type !== "COMPLAINT") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "This category cannot be used for complaints.",
      );
    }
  }

  // Store old image public ID
  const oldImagePublicId = complaint.imagePublicId;

  // Update complaint
  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data,
    include: {
      category: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId: citizenId,
    action: "UPDATE_COMPLAINT",
    entity: "Complaint",
    entityId: updatedComplaint.id,
    details: {
      updatedFields: Object.keys(data),
    },
  });

  // Delete old image from Cloudinary if a new image was uploaded
  if (data.imagePublicId && oldImagePublicId) {
    await deleteFromCloudinary(oldImagePublicId);
  }

  return updatedComplaint;
};

// Get active officers for complaint assignment
const getActiveOfficers = async () => {
  const officers = await prisma.user.findMany({
    where: {
      role: Role.OFFICER,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return officers;
};

// Assign Complaint
const assignComplaint = async (
  complaintId: string,
  officerId: string,
  assignedBy: string,
) => {
  // Check if complaint exists
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
    },
  });

  if (!complaint) {
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");
  }

  // Check complaint status
  if (complaint.status !== ComplaintStatus.APPROVED) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Only approved complaints can be assigned.",
    );
  }

  // Check if officer exists
  const officer = await prisma.user.findFirst({
    where: {
      id: officerId,
      role: "OFFICER",
      status: "ACTIVE",
      deletedAt: null,
    },
  });

  if (!officer) {
    throw new AppError(HttpStatus.NOT_FOUND, "Active officer not found.");
  }

  // Check officer availability
  const officerAvailable = await userService.isOfficerAvailable(officerId);

  if (!officerAvailable) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Officer is currently unavailable.",
    );
  }

  // Check if complaint is already assigned
  const existingAssignment = await prisma.assignment.findUnique({
    where: {
      complaintId,
    },
  });

  if (existingAssignment) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Complaint is already assigned.",
    );
  }

  // Assign complaint and update status
  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        officerId,
        complaintId,
        assignedBy,
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

    const updatedComplaint = await tx.complaint.update({
      where: {
        id: complaintId,
      },
      data: {
        status: ComplaintStatus.ASSIGNED,
        assignedAt: assignment.assignedAt,
      },
      include: {
        category: true,
      },
    });

    return {
      assignment,
      complaint: updatedComplaint,
    };
  });

  // Create audit log
  await createAuditLog({
    userId: assignedBy,
    action: "ASSIGN_COMPLAINT",
    entity: "Complaint",
    entityId: complaintId,
    details: {
      officerId,
    },
  });

  return result;
};

// Get Officer's assigned complaints
const getAssignedComplaints = async (officerId: string) => {
  const assignments = await prisma.assignment.findMany({
    where: {
      officerId,
      complaintId: {
        not: null,
      },
    },
    include: {
      complaint: {
        include: {
          category: true,
          citizen: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });

  return assignments;
};

// Update Complaint Status
const updateComplaintStatus = async (
  complaintId: string,
  userId: string,
  role: Role,
  newStatus: ComplaintStatus,
) => {
  // Check if complaint exists
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
    },
  });

  if (!complaint) {
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");
  }

  // Check officer assignment
  if (role === Role.OFFICER) {
    const assignment = await prisma.assignment.findUnique({
      where: {
        complaintId,
      },
    });

    if (!assignment || assignment.officerId !== userId) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "You are not assigned to this complaint.",
      );
    }
  }

  // Check allowed status transition
  if (
    role === Role.OFFICER &&
    complaint.status === ComplaintStatus.ASSIGNED &&
    newStatus !== ComplaintStatus.IN_PROGRESS
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Officer can only change assigned complaints to in-progress.",
    );
  }

  if (
    role === Role.OFFICER &&
    complaint.status === ComplaintStatus.IN_PROGRESS &&
    newStatus !== ComplaintStatus.COMPLETED
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Officer can only change in-progress complaints to completed.",
    );
  }

  if (role === Role.ADMIN) {
    if (complaint.status !== ComplaintStatus.PENDING) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Admin can only approve or reject pending complaints.",
      );
    }

    if (
      newStatus !== ComplaintStatus.APPROVED &&
      newStatus !== ComplaintStatus.REJECTED
    ) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Admin can only approve or reject a pending complaint.",
      );
    }
  }

  // Update complaint status
  const updatedComplaint = await prisma.complaint.update({
    where: {
      id: complaintId,
    },
    data: {
      status: newStatus,
      ...(newStatus === ComplaintStatus.COMPLETED && {
        resolvedAt: new Date(),
      }),
    },
    include: {
      category: true,
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignment: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: "UPDATE_COMPLAINT_STATUS",
    entity: "Complaint",
    entityId: complaintId,
    details: {
      previousStatus: complaint.status,
      newStatus,
    },
  });

  return updatedComplaint;
};

const cancelComplaint = async (complaintId: string, citizenId: string) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      citizenId,
      deletedAt: null,
    },
  });

  if (!complaint) {
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");
  }

  if (complaint.status !== ComplaintStatus.PENDING) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Only pending complaints can be canceled.",
    );
  }

  const updatedComplaint = await prisma.complaint.update({
    where: {
      id: complaintId,
    },
    data: {
      status: ComplaintStatus.CANCELED,
    },
  });

  await createAuditLog({
    userId: citizenId,
    action: "CANCEL_COMPLAINT",
    entity: "Complaint",
    entityId: complaintId,
  });

  return updatedComplaint;
};

// Delete Complaint
// Delete Complaint
const deleteComplaint = async (
  complaintId: string,
  userId: string,
  role: Role,
) => {
  // Find complaint
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
    },
  });

  if (!complaint) {
    throw new AppError(HttpStatus.NOT_FOUND, "Complaint not found.");
  }

  // Citizen can delete only their own complaints
  if (role === Role.CITIZEN && complaint.citizenId !== userId) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You do not have permission to delete this complaint.",
    );
  }

  // Citizen can delete:
  // PENDING, REJECTED, CANCELED
  if (role === Role.CITIZEN) {
    const canDelete =
      complaint.status === ComplaintStatus.PENDING ||
      complaint.status === ComplaintStatus.REJECTED ||
      complaint.status === ComplaintStatus.CANCELED;

    if (!canDelete) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "This complaint cannot be deleted in its current status.",
      );
    }
  }

  // Admin can delete only:
  // REJECTED, CANCELED
  if (role === Role.ADMIN) {
    const canDelete =
      complaint.status === ComplaintStatus.REJECTED ||
      complaint.status === ComplaintStatus.CANCELED;

    if (!canDelete) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Admin can only delete rejected or canceled complaints.",
      );
    }
  }

  // Soft delete complaint
  const deletedComplaint = await prisma.complaint.update({
    where: {
      id: complaintId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: "DELETE_COMPLAINT",
    entity: "Complaint",
    entityId: deletedComplaint.id,
    details: {
      softDeleted: true,
      deletedByRole: role,
      previousStatus: complaint.status,
    },
  });

  return deletedComplaint;
};

export const complaintService = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  getPublicComplaints,
  updateComplaint,
  getActiveOfficers,
  assignComplaint,
  getAssignedComplaints,
  updateComplaintStatus,
  cancelComplaint,
  deleteComplaint,
};
