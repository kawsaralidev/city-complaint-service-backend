import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { categoryService } from "./category.service";

// Create Category
const createCategory = async (req: Request, res: Response) => {
  const { name, type } = req.body;

  const category = await categoryService.createCategory(name, type);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Category created successfully.",
    data: category,
  });
};

// Get all active categories
const getAllCategories = async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Categories retrieved successfully.",
    data: categories,
  });
};

// Get category by ID
const getCategoryById = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await categoryService.getCategoryById(id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Category retrieved successfully.",
    data: category,
  });
};

// Update category
const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await categoryService.updateCategory(id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Category updated successfully.",
    data: category,
  });
};

// Update category status
const updateCategoryStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { isActive } = req.body;

  const category = await categoryService.updateCategoryStatus(id, isActive);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Category status updated successfully.",
    data: category,
  });
};

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
};
