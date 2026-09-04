import { ComplaintStatus, Role } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { deleteFromCloudinary } from "../../utils/cloudinary";

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
    throw new Error("Category not found.");
  }

  // Throw an error if category is inactive
  if (!category.isActive) {
    throw new Error("This category is currently inactive.");
  }

  // Throw an error if category is not for complaints
  if (category.type !== "COMPLAINT") {
    throw new Error("This category cannot be used for complaints.");
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

/// Get complaint by ID
const getComplaintById = async (
  complaintId: string,
  userId: string,
  role: Role,
) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
      ...(role === Role.CITIZEN && {
        citizenId: userId,
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
      resolution: true,
    },
  });

  // Throw an error if complaint does not exist
  if (!complaint) {
    throw new Error("Complaint not found.");
  }

  return complaint;
};

// Get all complaints
const getAllComplaints = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ComplaintStatus;
  categoryId?: string;
}) => {
  const { page = 1, limit = 10, search, status, categoryId } = query;

  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
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
        resolution: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.complaint.count({
      where,
    }),
  ]);

  return {
    complaints,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

  if (!complaint) throw new Error("Complaint not found.");

  // Check complaint status
  if (complaint.status !== ComplaintStatus.PENDING) {
    throw new Error("Only pending complaints can be edited.");
  }

  // Check category if categoryId is provided
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) throw new Error("Category not found.");

    if (!category.isActive) {
      throw new Error("This category is currently inactive.");
    }

    if (category.type !== "COMPLAINT") {
      throw new Error("This category cannot be used for complaints.");
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

  // Delete old image from Cloudinary if a new image was uploaded
  if (data.imagePublicId && oldImagePublicId) {
    await deleteFromCloudinary(oldImagePublicId);
  }

  return updatedComplaint;
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

  if (!complaint) throw new Error("Complaint not found.");

  // Check complaint status
  if (complaint.status !== ComplaintStatus.PENDING) {
    throw new Error("Only pending complaints can be assigned.");
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
    throw new Error("Active officer not found.");
  }

  // Check if complaint is already assigned
  const existingAssignment = await prisma.assignment.findUnique({
    where: {
      complaintId,
    },
  });

  if (existingAssignment) {
    throw new Error("Complaint is already assigned.");
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
          resolution: true,
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
    throw new Error("Complaint not found.");
  }

  // Check officer assignment
  if (role === Role.OFFICER) {
    const assignment = await prisma.assignment.findUnique({
      where: {
        complaintId,
      },
    });

    if (!assignment || assignment.officerId !== userId) {
      throw new Error("You are not assigned to this complaint.");
    }
  }

  // Check allowed status transition
  if (
    role === Role.OFFICER &&
    complaint.status === ComplaintStatus.ASSIGNED &&
    newStatus !== ComplaintStatus.IN_PROGRESS
  ) {
    throw new Error(
      "Officer can only change an assigned complaint to in progress.",
    );
  }

  if (
    role === Role.OFFICER &&
    complaint.status === ComplaintStatus.IN_PROGRESS &&
    newStatus !== ComplaintStatus.RESOLVED
  ) {
    throw new Error(
      "Officer can only change an in progress complaint to resolved.",
    );
  }

  if (
    role === Role.ADMIN &&
    (complaint.status !== ComplaintStatus.RESOLVED ||
      newStatus !== ComplaintStatus.CLOSED)
  ) {
    throw new Error("Admin can only close a resolved complaint.");
  }

  // Update complaint status
  const updatedComplaint = await prisma.complaint.update({
    where: {
      id: complaintId,
    },
    data: {
      status: newStatus,
      ...(newStatus === ComplaintStatus.RESOLVED && {
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
      resolution: true,
    },
  });

  return updatedComplaint;
};

// Add Complaint Resolution
const createComplaintResolution = async (
  complaintId: string,
  officerId: string,
  data: {
    description: string;
    imageUrl?: string;
    imagePublicId?: string;
  },
) => {
  // Check if complaint exists
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      deletedAt: null,
    },
  });

  if (!complaint) {
    throw new Error("Complaint not found.");
  }

  // Check complaint status
  if (complaint.status !== ComplaintStatus.IN_PROGRESS) {
    throw new Error(
      "Resolution can only be added to an in progress complaint.",
    );
  }

  // Check officer assignment
  const assignment = await prisma.assignment.findUnique({
    where: {
      complaintId,
    },
  });

  if (!assignment || assignment.officerId !== officerId) {
    throw new Error("You are not assigned to this complaint.");
  }

  // Check if resolution already exists
  const existingResolution = await prisma.resolution.findUnique({
    where: {
      complaintId,
    },
  });

  if (existingResolution) {
    throw new Error("Resolution already exists for this complaint.");
  }

  // Create resolution and update complaint status
  const result = await prisma.$transaction(async (tx) => {
    const resolution = await tx.resolution.create({
      data: {
        complaintId,
        officerId,
        description: data.description,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
      },
      include: {
        officer: {
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
        status: ComplaintStatus.RESOLVED,
        resolvedAt: resolution.resolvedAt,
      },
      include: {
        category: true,
        resolution: true,
      },
    });

    return {
      resolution,
      complaint: updatedComplaint,
    };
  });

  return result;
};

export const complaintService = {
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
