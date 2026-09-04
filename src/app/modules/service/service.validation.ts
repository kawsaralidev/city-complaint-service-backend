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

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid service ID"),
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3, "Service name must be at least 3 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .min(10, "Service description must be at least 10 characters")
        .optional(),

      baseFee: z.coerce
        .number()
        .positive("Service fee must be greater than 0")
        .optional(),

      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.description !== undefined ||
        data.baseFee !== undefined ||
        data.isActive !== undefined,
      {
        message: "At least one field is required to update the service.",
      },
    ),
});
