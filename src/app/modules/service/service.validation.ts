import { z } from "zod";

export const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Service name must be at least 3 characters"),

    description: z
      .string()
      .trim()
      .min(10, "Service description must be at least 10 characters")
      .optional(),

    baseFee: z.coerce.number().positive("Service fee must be greater than 0"),
  }),
});
