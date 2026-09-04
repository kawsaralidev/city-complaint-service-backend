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

// Get complaint by ID
const getComplaintById = async (complaintId: string, citizenId: string) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: complaintId,
      citizenId,
      deletedAt: null,
    },
    include: {
      category: true,
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

export const complaintService = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
};
