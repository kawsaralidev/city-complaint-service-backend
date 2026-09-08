import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { categoryService } from "./category.service";
import { sendResponse } from "../../utils/sendResponse";

// Create Category
const createCategory = async (req: Request, res: Response) => {
	const { name, type } = req.body;

	const category = await categoryService.createCategory(name, type);

	sendResponse(res, {
		statusCode: HttpStatus.CREATED,
		success: true,
		message: "Category created successfully.",
		data: category,
	});
};

// Get all active categories
const getAllCategories = async (req: Request, res: Response) => {
	const categories = await categoryService.getAllCategories();

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Categories retrieved successfully.",
		data: categories,
	});
};

// Get category by ID
const getCategoryById = async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const category = await categoryService.getCategoryById(id);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Category retrieved successfully.",
		data: category,
	});
};

// Update category
const updateCategory = async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const category = await categoryService.updateCategory(id, req.body);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
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

	sendResponse(res, {
		statusCode: HttpStatus.OK,
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
