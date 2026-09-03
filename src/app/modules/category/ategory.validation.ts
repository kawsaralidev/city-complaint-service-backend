import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters"),

    type: z.enum(["COMPLAINT", "SERVICE"]),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .optional(),

    type: z.enum(["COMPLAINT", "SERVICE"]).optional(),
  }),
});

export const updateCategoryStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});
