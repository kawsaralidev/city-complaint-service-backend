import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const keyGenerator = (req: Request) => {
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "");
};

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    errors: [],
  },
});
