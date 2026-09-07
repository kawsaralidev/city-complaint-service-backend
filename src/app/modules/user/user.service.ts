import { HttpStatus } from "../../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/auditLog";
import type { IGetAllUsersParams } from "./user.interface";

const getAllUsers = async ({
	page,
	limit,
	search,
	role,
	status,
	sortOrder,
}: IGetAllUsersParams) => {
	const skip = (page - 1) * limit;

	// Build user filters
	const where = {
		...(status === "DELETED"
			? {
					deletedAt: {
						not: null,
					},
				}
			: {
					deletedAt: null,
					...(status && {
						status,
					}),
				}),

		...(role && {
			role,
		}),

		...(search && {
			OR: [
				{
					name: {
						contains: search,
						mode: "insensitive" as const,
					},
				},
				{
					email: {
						contains: search,
						mode: "insensitive" as const,
					},
				},
			],
		}),
	};

	// Get users and total count
	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				emailVerified: true,
				authProvider: true,
				imageUrl: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: {
				createdAt: sortOrder,
			},
			skip,
			take: limit,
		}),

		prisma.user.count({
			where,
		}),
	]);

	return {
		data: users,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// Update user status
const updateUserStatus = async (
	userId: string,
	status: "ACTIVE" | "BLOCKED",
	adminId: string,
) => {
	// Check if user exists
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(HttpStatus.NOT_FOUND, "User not found.");
	}

	// Check if user is already deleted
	if (user.deletedAt) {
		throw new AppError(HttpStatus.BAD_REQUEST, "Deleted users cannot be updated.");
	}

	// Check if status is already the same
	if (user.status === status) {
		throw new AppError(HttpStatus.CONFLICT, `User is already ${status.toLowerCase()}.`);
	}

	// Update user status
	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			status,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			emailVerified: true,
			authProvider: true,
			imageUrl: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	// Create audit log
	await createAuditLog({
		userId: adminId,
		action: "UPDATE_USER_STATUS",
		entity: "User",
		entityId: updatedUser.id,
		details: {
			previousStatus: user.status,
			newStatus: status,
		},
	});

	return updatedUser;
};

export const userService = {
	getAllUsers,
	updateUserStatus,
};
