import { z } from "zod";

export const getAllAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().optional(),

  action: z.string().trim().optional(),

  entity: z.string().trim().optional(),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
