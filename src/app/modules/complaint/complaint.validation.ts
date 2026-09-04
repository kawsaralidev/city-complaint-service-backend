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

export const updateComplaintSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid complaint ID"),
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(5, "Complaint title must be at least 5 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .min(10, "Complaint description must be at least 10 characters")
        .optional(),

      location: z
        .string()
        .trim()
        .min(3, "Complaint location must be at least 3 characters")
        .optional(),

      categoryId: z
        .string()
        .uuid("Please provide a valid category ID")
        .optional(),
    })
    .refine(
      (data) =>
        data.title !== undefined ||
        data.description !== undefined ||
        data.location !== undefined ||
        data.categoryId !== undefined,
      {
        message: "At least one field is required to update the complaint.",
      },
    ),
});

export const assignComplaintSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid complaint ID"),
  }),
  body: z.object({
    officerId: z.string().uuid("Please provide a valid officer ID"),
  }),
});

export const updateComplaintStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid complaint ID"),
  }),
  body: z.object({
    status: z.enum(["IN_PROGRESS", "RESOLVED", "CLOSED"]),
  }),
});

export const createComplaintResolutionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid complaint ID"),
  }),
  body: z.object({
    description: z
      .string()
      .trim()
      .min(10, "Resolution description must be at least 10 characters"),
    imageUrl: z.string().url("Please provide a valid image URL").optional(),
  }),
});
