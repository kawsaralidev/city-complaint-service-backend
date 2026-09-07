import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get(
	"/admin/overview",
	auth(Role.ADMIN),
	dashboardController.getAdminDashboardOverview,
);

router.get(
	"/admin/analytics",
	auth(Role.ADMIN),
	dashboardController.getAdminDashboardAnalytics,
);

export const dashboardRoutes = router;
