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
