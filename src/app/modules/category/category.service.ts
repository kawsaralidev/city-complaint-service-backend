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

export const categoryService = {
  createCategory,
  getAllCategories,
};
