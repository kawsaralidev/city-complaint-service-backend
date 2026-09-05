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
