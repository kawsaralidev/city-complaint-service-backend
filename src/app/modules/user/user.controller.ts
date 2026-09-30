import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { userService } from "./user.service";
import {
  getAllUsersQuerySchema,
  updateUserStatusSchema,
} from "./user.validation";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

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

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  await userService.changePassword(userId, currentPassword, newPassword);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const reqBody = req.body;
  const reqFile = req.file;

  const result = await userService.updateMyProfile(userId, reqBody, reqFile);

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
  changePassword,
  updateMyProfile,
};
