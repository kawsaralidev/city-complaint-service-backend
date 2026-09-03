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

export const categoryController = {
  createCategory,
  getAllCategories,
};
