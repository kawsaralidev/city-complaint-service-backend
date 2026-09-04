import { z } from "zod";

export const createComplaintSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(5, "Complaint title must be at least 5 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Complaint description must be at least 10 characters"),

    location: z
      .string()
      .trim()
      .min(3, "Complaint location must be at least 3 characters"),

    categoryId: z.string().uuid("Please provide a valid category ID"),
  }),
});

export const getAllComplaintsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    search: z.string().trim().optional(),

    status: z
      .enum([
        "PENDING",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
        "REJECTED",
        "CANCELED",
      ])
      .optional(),

    categoryId: z.string().uuid().optional(),
  }),
});
