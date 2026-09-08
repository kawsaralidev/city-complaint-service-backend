import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { userService } from "./user.service";
import {
	getAllUsersQuerySchema,
	updateUserStatusSchema,
} from "./user.validation";
import { sendResponse } from "../../utils/sendResponse";

const getAllUsers = async (req: Request, res: Response) => {
	const { query } = getAllUsersQuerySchema.parse({
		query: req.query,
	});

	const users = await userService.getAllUsers({
		page: query.page,
		limit: query.limit,
		search: query.search,
		role: query.role,
		status: query.status,
		sortOrder: query.sortOrder,
	});

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Users retrieved successfully.",
		data: users,
	});
};

// Update user status
const updateUserStatus = async (req: Request, res: Response) => {
	const { params, body } = updateUserStatusSchema.parse({
		params: req.params,
		body: req.body,
	});

	const adminId = req.user!.userId;

	const user = await userService.updateUserStatus(
		params.id,
		body.status,
		adminId,
	);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "User status updated successfully.",
		data: user,
	});
};

const updateMyProfile = async (req: Request, res: Response) => {
	const userId = req.user!.userId;

	const result = await userService.updateMyProfile(userId, req.body, req.file);

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Profile updated successfully.",
		data: result,
	});
};

export const userController = {
	getAllUsers,
	updateUserStatus,
	updateMyProfile,
};
