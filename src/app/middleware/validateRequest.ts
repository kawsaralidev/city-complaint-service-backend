import type { NextFunction, Request, Response } from "express";

import type z from "zod";

import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodObject) => {
  return catchAsync((req: Request, _res: Response, next: NextFunction) => {
    // Prepare request data for validation
    const payload = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    // Validate request data using the provided Zod schema
    const result = zodSchema.safeParse(payload);

    // Throw validation error if request data is invalid
    if (!result.success) {
      console.log(result.error);
      console.log(result.error.issues);

      throw new Error(result.error.issues[0].message);
    }

    // Update request body with validated data
    req.body = result.data.body;

    next();
  });
};
