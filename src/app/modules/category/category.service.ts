import { Role, type CategoryType } from "../../../../generated/prisma/enums";
import { HttpStatus } from "../../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { createAuditLog } from "../../utils/auditLog";

// Create Category
const createCategory = async (
  name: string,
  type: CategoryType,
  userId: string,
) => {
  // Check if category already exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      name,
    },
  });

  // Throw an error if category already exists
  if (existingCategory) {
    throw new AppError(
      HttpStatus.CONFLICT,
      "Category with this name already exists.",
    );
  }

  // Create category
  const category = await prisma.category.create({
    data: {
      name,
      type,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE_CATEGORY",
    entity: "Category",
    entityId: category.id,
    details: {
      name: category.name,
      type: category.type,
    },
  });

  return category;
};

// Get active categories
const getAllCategories = async (role: Role) => {
  const categories = await prisma.category.findMany({
    where: {
      ...(role !== Role.ADMIN && {
        isActive: true,
      }),
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};

// Get category by ID
const getCategoryById = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      isActive: true,
    },
  });

  // Throw an error if category does not exist
  if (!category) {
    throw new AppError(HttpStatus.NOT_FOUND, "Category not found.");
  }

  return category;
};

// Update category
const updateCategory = async (
  id: string,
  data: {
    name?: string;
    type?: CategoryType;
  },
  userId: string,
) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  // Throw an error if category does not exist
  if (!existingCategory) {
    throw new AppError(HttpStatus.NOT_FOUND, "Category not found.");
  }

  // Check if new category name already exists
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicateCategory) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "Category with this name already exists.",
      );
    }
  }

  // Update category
  const category = await prisma.category.update({
    where: {
      id,
    },
    data,
  });

  await createAuditLog({
    userId,
    action: "UPDATE_CATEGORY",
    entity: "Category",
    entityId: category.id,
    details: {
      changes: data,
    },
  });

  return category;
};

// Update category status
const updateCategoryStatus = async (
  id: string,
  isActive: boolean,
  userId: string,
) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  // Throw an error if category does not exist
  if (!existingCategory) {
    throw new AppError(HttpStatus.NOT_FOUND, "Category not found.");
  }

  // Update category status
  const category = await prisma.category.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE_CATEGORY_STATUS",
    entity: "Category",
    entityId: category.id,
    details: {
      isActive,
    },
  });

  return category;
};

// Get all categories for admin
const getAllCategoriesForAdmin = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
  getAllCategoriesForAdmin,
};
