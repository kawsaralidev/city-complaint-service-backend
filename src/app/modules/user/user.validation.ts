import { z } from "zod";

export const getAllUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(15),

    search: z.string().trim().optional(),

    role: z.enum(["CITIZEN", "OFFICER", "ADMIN"]).optional(),

    status: z.enum(["ACTIVE", "BLOCKED", "DELETED"]).optional(),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Please provide a valid user ID"),
  }),

  body: z.object({
    status: z.enum(["ACTIVE", "BLOCKED"]),
  }),
});
