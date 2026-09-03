import { CategoryType } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

// Create Category
const createCategory = async (name: string, type: CategoryType) => {
  // Check if category already exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      name,
    },
  });

  // Throw an error if category already exists
  if (existingCategory) {
    throw new Error("Category with this name already exists.");
  }

  // Create category
  const category = await prisma.category.create({
    data: {
      name,
      type,
    },
  });

  return category;
};

// Get active categories
const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
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
    throw new Error("Category not found.");
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
) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  // Throw an error if category does not exist
  if (!existingCategory) {
    throw new Error("Category not found.");
  }

  // Check if new category name already exists
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicateCategory) {
      throw new Error("Category with this name already exists.");
    }
  }

  // Update category
  const category = await prisma.category.update({
    where: {
      id,
    },
    data,
  });

  return category;
};

// Update category status
const updateCategoryStatus = async (id: string, isActive: boolean) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  // Throw an error if category does not exist
  if (!existingCategory) {
    throw new Error("Category not found.");
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

  return category;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
};
