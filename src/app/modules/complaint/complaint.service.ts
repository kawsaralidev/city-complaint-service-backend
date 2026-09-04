import { ComplaintStatus, Role } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

// Create Complaint
const createComplaint = async (
  citizenId: string,
  data: {
    title: string;
    description: string;
    location: string;
    categoryId: string;
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

export const complaintService = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
};
