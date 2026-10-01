import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { categoryService } from "./category.service";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";

// Create Category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, type } = req.body;
  const userId = req.user?.userId as string;

  const category = await categoryService.createCategory(name, type, userId);

  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Category created successfully.",
    data: category,
  });
});

// Get all active categories
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const role = req.user?.role;

  if (!role) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authenticated.");
  }

  const categories = await categoryService.getAllCategories(role);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Categories retrieved successfully.",
    data: categories,
  });
});

// Get category by ID
const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await categoryService.getCategoryById(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Category retrieved successfully.",
    data: category,
  });
});

// Update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.userId as string;

  const category = await categoryService.updateCategory(id, req.body, userId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Category updated successfully.",
    data: category,
  });
});

// Update category status
const updateCategoryStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { isActive } = req.body;
  const userId = req.user?.userId as string;

  const category = await categoryService.updateCategoryStatus(
    id,
    isActive,
    userId,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Category status updated successfully.",
    data: category,
  });
});

// Get all categories for admin
const getAllCategoriesForAdmin = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategoriesForAdmin();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "All categories retrieved successfully.",
    data: categories,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
  getAllCategoriesForAdmin,
};
