import type { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (
	request: Request,
	response: Response,
	next: NextFunction,
) => unknown | Promise<unknown>;

export const catchAsync = (fn: AsyncRequestHandler) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await fn(req, res, next);
		} catch (error) {
			next(error);
		}
	};
};
