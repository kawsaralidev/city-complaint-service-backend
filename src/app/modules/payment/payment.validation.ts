import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    serviceRequestId: z
      .string()
      .uuid("Please provide a valid service request ID"),
  }),
});
