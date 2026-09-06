import { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { userService } from "./user.service";
import {
  getAllUsersQuerySchema,
  updateUserStatusSchema,
} from "./user.validation";

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

  res.status(HttpStatus.OK).json({
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

  res.status(HttpStatus.OK).json({
    success: true,
    message: "User status updated successfully.",
    data: user,
  });
};

export const userController = {
  getAllUsers,
  updateUserStatus,
};
