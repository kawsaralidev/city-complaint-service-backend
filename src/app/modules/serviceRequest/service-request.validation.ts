import { z } from "zod";

export const createServiceRequestSchema = z.object({
	body: z.object({
		serviceId: z.string().uuid("Please provide a valid service ID"),
		description: z
			.string()
			.trim()
			.min(10, "Description must be at least 10 characters")
			.optional(),
		location: z
			.string()
			.trim()
			.min(3, "Location must be at least 3 characters"),
	}),
});

export const reviewServiceRequestSchema = z.object({
	body: z.object({
		status: z.enum(["APPROVED", "REJECTED"]),
	}),
});

export const assignServiceRequestSchema = z.object({
	body: z.object({
		officerId: z.string().uuid("Please provide a valid officer ID"),
	}),
});

export const updateServiceRequestStatusInProgressSchema = z.object({
	body: z.object({
		status: z.enum(["IN_PROGRESS", "COMPLETED"]),
	}),
});

export const getAllServiceRequestsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(15),

	search: z.string().trim().optional(),

	status: z
		.enum([
			"PENDING",
			"APPROVED",
			"PAYMENT_PENDING",
			"CONFIRMED",
			"ASSIGNED",
			"IN_PROGRESS",
			"COMPLETED",
			"REJECTED",
			"CANCELED",
		])
		.optional(),

	serviceId: z.string().uuid("Please provide a valid service ID").optional(),

	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
