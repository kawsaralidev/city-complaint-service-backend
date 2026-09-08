import type { Request, Response } from "express";
import { HttpStatus } from "../../../constants/httpStatus";
import { dashboardService } from "./dashboard.service";
import { sendResponse } from "../../utils/sendResponse";

const getAdminDashboardOverview = async (_req: Request, res: Response) => {
	const dashboard = await dashboardService.getAdminDashboardOverview();

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Admin dashboard overview retrieved successfully.",
		data: dashboard,
	});
};

// Get admin dashboard analytics
const getAdminDashboardAnalytics = async (_req: Request, res: Response) => {
	const analytics = await dashboardService.getAdminDashboardAnalytics();

	sendResponse(res, {
		statusCode: HttpStatus.OK,
		success: true,
		message: "Admin dashboard analytics retrieved successfully.",
		data: analytics,
	});
};

export const dashboardController = {
	getAdminDashboardOverview,
	getAdminDashboardAnalytics,
};
