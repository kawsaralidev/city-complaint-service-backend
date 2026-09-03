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

export const categoryController = {
  createCategory,
};
